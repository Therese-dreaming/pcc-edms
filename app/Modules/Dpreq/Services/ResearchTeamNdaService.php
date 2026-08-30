<?php

namespace App\Modules\Dpreq\Services;

use App\Modules\Dpreq\Jobs\GenerateResearchTeamNdaPdfJob;
use App\Modules\Dpreq\Mail\ResearchTeamNdaInvitationMail;
use App\Modules\Dpreq\Models\ResearchTeamNda;
use App\Modules\Dpreq\Models\ResearchTeamNdaSignatory;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\AuditLog\Support\SignatureIdentity;
use App\Shared\Clearance\Services\ClearanceService;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use RuntimeException;

// docs/2.1-dpnda-nda-template.md §2.1.a (Form 2, DPO-POL-005). Created automatically alongside
// every research application (docs/0.4) with the submitting applicant as the "leader"
// signatory. Known simplification: Form 1 only captures a researcher *count*, not co-researcher
// identities (docs/1.1 has no field for it), so only the lead applicant's signatory row is
// created for now — inviting/adding co-researcher signatories is a follow-up, not built here.
class ResearchTeamNdaService
{
    // stakeholder-additional-features.md (2026-07-25) — signing links "expire after a
    // configurable period." 14 days is the default; change here if the requester specifies one.
    private const LINK_EXPIRY_DAYS = 14;

    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
        private readonly ClearanceService $clearance,
    ) {
    }

    /**
     * Add a co-researcher to the team NDA and email them a unique, single-use, expiring signing
     * link (stakeholder-additional-features.md, "Individual Member Electronic Signature
     * Workflow"). Only allowed while the NDA is still gathering signatures.
     */
    public function addMember(ResearchTeamNda $nda, string $fullName, string $email, string $role = 'member'): ResearchTeamNdaSignatory
    {
        if ($nda->status !== 'pending_signatures') {
            throw new RuntimeException('Members can only be added while the NDA is still awaiting signatures.');
        }

        $signatory = ResearchTeamNdaSignatory::create([
            'research_team_nda_id' => $nda->id,
            'full_name' => $fullName,
            'email' => $email,
            'role' => $role,
        ]);

        $this->issueSigningLink($signatory);

        $this->auditLog->record('research_team_nda.member_added', $signatory, null, [
            'full_name' => $fullName,
            'email' => $email,
            'role' => $role,
        ]);

        return $signatory->fresh();
    }

    /**
     * Re-issue a member's signing link (new token + new expiry) and email it again — e.g. if the
     * previous link expired or was lost. Refused once the member has signed.
     */
    public function resendInvitation(ResearchTeamNdaSignatory $signatory): void
    {
        if ($signatory->hasSigned()) {
            throw new RuntimeException('This member has already signed.');
        }

        $this->issueSigningLink($signatory);
        $this->auditLog->record('research_team_nda.invitation_resent', $signatory, null, ['email' => $signatory->email]);
    }

    /**
     * Sign via a member's emailed link. Enforces single-use (not already signed) and expiry
     * before delegating to sign(). The token itself is the authorization — no login required.
     */
    public function signByToken(string $token, string $typedFullName, ?string $signatureImage = null): ResearchTeamNdaSignatory
    {
        $signatory = ResearchTeamNdaSignatory::where('signing_token', $token)->first();

        if ($signatory === null) {
            throw new RuntimeException('This signing link is not valid.');
        }

        if ($signatory->hasSigned()) {
            throw new RuntimeException('This signing link has already been used.');
        }

        if ($signatory->isTokenExpired()) {
            throw new RuntimeException('This signing link has expired. Ask the research team leader to resend it.');
        }

        return $this->sign($signatory, $typedFullName, $signatureImage);
    }

    private function issueSigningLink(ResearchTeamNdaSignatory $signatory): void
    {
        $expiresAt = now()->addDays(self::LINK_EXPIRY_DAYS);

        $signatory->update([
            'signing_token' => $this->uniqueToken(),
            'token_expires_at' => $expiresAt,
            'invited_at' => now(),
        ]);

        $nda = $signatory->researchTeamNda;

        // Sent synchronously (send(), not queue()) — the signatory is actively waiting on this
        // link and there is no queue worker running in this deployment (concern 6 / A2).
        Mail::to($signatory->email)->send(new ResearchTeamNdaInvitationMail(
            memberName: $signatory->full_name,
            researchTitle: $nda->researchApplication->research_title,
            trackingNumber: $nda->tracking_number,
            signingUrl: route('nda.sign', $signatory->fresh()->signing_token),
            expiresAt: $expiresAt->format('F j, Y g:i A'),
        ));
    }

    private function uniqueToken(): string
    {
        do {
            $token = Str::random(64);
        } while (ResearchTeamNdaSignatory::where('signing_token', $token)->exists());

        return $token;
    }

    public function createForApplication(ResearchApplication $researchApplication): ResearchTeamNda
    {
        return DB::transaction(function () use ($researchApplication) {
            $nda = ResearchTeamNda::create([
                'research_application_id' => $researchApplication->id,
                'tracking_number' => $this->nextTrackingNumber(),
                'status' => 'pending_signatures',
            ]);

            ResearchTeamNdaSignatory::create([
                'research_team_nda_id' => $nda->id,
                'user_id' => $researchApplication->applicant_id,
                'full_name' => $researchApplication->applicant->name,
                'role' => 'leader',
            ]);

            $this->auditLog->record('research_team_nda.created', $nda, null, $nda->toArray());

            return $nda;
        });
    }

    public function sign(ResearchTeamNdaSignatory $signatory, string $typedFullName, ?string $signatureImage = null): ResearchTeamNdaSignatory
    {
        if ($signatory->signed_at !== null) {
            throw new RuntimeException('This signatory has already signed.');
        }

        $identity = SignatureIdentity::capture();

        $signatory->update([
            // ADR-005: typed full name + timestamp remains the legally-operative signature
            // record; signature_image is the cosmetic canvas capture rendered onto the PDF
            // alongside it. signature_ip/user_agent add signer identification (2026-07-25).
            'signature_id' => $typedFullName,
            'signature_image' => $signatureImage,
            'signature_ip' => $identity['ip'],
            'signature_user_agent' => $identity['user_agent'],
            'signed_at' => now(),
        ]);

        $this->auditLog->record('research_team_nda.signed', $signatory, null, $signatory->fresh()->toArray());

        $nda = $signatory->researchTeamNda;

        if ($nda->isFullySigned()) {
            $fromStatus = $nda->status;
            $nda->update(['status' => 'completed']);
            // The final signer may be a token-only invitee with no account (unauthenticated
            // request) — pass their user id explicitly (nullable) instead of relying on Auth.
            $this->statusHistory->record($nda, $fromStatus, 'completed', null, $signatory->user_id);
            $this->auditLog->record('research_team_nda.completed', $nda, ['status' => $fromStatus], ['status' => 'completed']);

            GenerateResearchTeamNdaPdfJob::dispatch($nda->id, $signatory->user_id);

            // concern 7 (2026-07-26): the DPO clearance is gated on the whole team signing, not on
            // approval. Now that every signatory has signed, issue it — attributed to the DPO who
            // approved. signDpoTrack is idempotent and performs the approved -> clearance_issued
            // transition itself.
            $researchApplication = $nda->researchApplication;
            $approverId = $researchApplication->dpreqApplication?->approved_by
                ?? $researchApplication->applicant_id;
            $this->clearance->signDpoTrack($researchApplication, $approverId);
        }

        return $signatory->fresh();
    }

    private function nextTrackingNumber(): string
    {
        // RTNDA (Research Team NDA, Form 2) — distinct from DPNDA (Module 2, Form 5's
        // OJT/Trainee NDA tracking prefix) to avoid confusing the two NDA instruments docs/2.1
        // splits apart.
        $year = now()->year;
        $count = ResearchTeamNda::where('tracking_number', 'like', "RTNDA-{$year}-%")->lockForUpdate()->count();

        return sprintf('RTNDA-%d-%04d', $year, $count + 1);
    }
}
