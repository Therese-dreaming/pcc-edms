<?php

namespace App\Modules\Dpreq\Services;

use App\Modules\Dpreq\Jobs\GenerateResearchTeamNdaPdfJob;
use App\Modules\Dpreq\Models\ResearchTeamNda;
use App\Modules\Dpreq\Models\ResearchTeamNdaSignatory;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use RuntimeException;

// docs/2.1-dpnda-nda-template.md §2.1.a (Form 2, DPO-POL-005). Created automatically alongside
// every research application (docs/0.4) with the submitting applicant as the "leader"
// signatory. Known simplification: Form 1 only captures a researcher *count*, not co-researcher
// identities (docs/1.1 has no field for it), so only the lead applicant's signatory row is
// created for now — inviting/adding co-researcher signatories is a follow-up, not built here.
class ResearchTeamNdaService
{
    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
    ) {
    }

    public function createForApplication(ResearchApplication $researchApplication): ResearchTeamNda
    {
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
    }

    public function sign(ResearchTeamNdaSignatory $signatory, string $typedFullName, ?string $signatureImage = null): ResearchTeamNdaSignatory
    {
        if ($signatory->signed_at !== null) {
            throw new RuntimeException('This signatory has already signed.');
        }

        $signatory->update([
            // ADR-005: typed full name + timestamp remains the legally-operative signature
            // record; signature_image is the cosmetic canvas capture rendered onto the PDF
            // alongside it.
            'signature_id' => $typedFullName,
            'signature_image' => $signatureImage,
            'signed_at' => now(),
        ]);

        $this->auditLog->record('research_team_nda.signed', $signatory, null, $signatory->fresh()->toArray());

        $nda = $signatory->researchTeamNda;

        if ($nda->isFullySigned()) {
            $fromStatus = $nda->status;
            $nda->update(['status' => 'completed']);
            $this->statusHistory->record($nda, $fromStatus, 'completed');
            $this->auditLog->record('research_team_nda.completed', $nda, ['status' => $fromStatus], ['status' => 'completed']);

            GenerateResearchTeamNdaPdfJob::dispatch($nda->id, $signatory->user_id);
        }

        return $signatory->fresh();
    }

    private function nextTrackingNumber(): string
    {
        // RTNDA (Research Team NDA, Form 2) — distinct from DPNDA (Module 2, Form 5's
        // OJT/Trainee NDA tracking prefix) to avoid confusing the two NDA instruments docs/2.1
        // splits apart.
        $year = now()->year;
        $count = ResearchTeamNda::where('tracking_number', 'like', "RTNDA-{$year}-%")->count();

        return sprintf('RTNDA-%d-%04d', $year, $count + 1);
    }
}
