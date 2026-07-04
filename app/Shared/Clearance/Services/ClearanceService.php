<?php

namespace App\Shared\Clearance\Services;

use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\Clearance\Jobs\GenerateJointClearancePdfJob;
use App\Shared\Clearance\Models\ClearanceCertificate;
use App\Shared\Notifications\Services\NotificationService;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Support\Str;

// docs/0.4-dpo-ethics-integration.md — the DPO <-> Ethics convergence point. Both
// DpreqWorkflowService::approve() and Remis's positive-decision path call in here; neither
// module depends on the other directly (system-design.md §4's module-boundary rule), they both
// only depend on this shared service. The certificate is withheld (no issued_at/qr_token/PDF)
// until both signatures exist — this is the one rule that must never be bypassed.
class ClearanceService
{
    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
        private readonly NotificationService $notifications,
    ) {
    }

    public function signDpoTrack(ResearchApplication $researchApplication, int $signerId, string $certificateNumber): ClearanceCertificate
    {
        $certificate = $this->ensureCertificate($researchApplication);

        $certificate->update([
            'dpreq_certificate_number' => $certificateNumber,
            'dpo_signed_by' => $signerId,
            'dpo_signed_at' => now(),
        ]);

        $this->auditLog->record('clearance_certificate.dpo_signed', $certificate, null, ['dpo_signed_by' => $signerId]);

        $this->maybeIssue($certificate->fresh());

        return $certificate->fresh();
    }

    public function signEthicsTrack(ResearchApplication $researchApplication, int $signerId, string $certificateNumber): ClearanceCertificate
    {
        $certificate = $this->ensureCertificate($researchApplication);

        $certificate->update([
            'remis_certificate_number' => $certificateNumber,
            'ethics_signed_by' => $signerId,
            'ethics_signed_at' => now(),
        ]);

        $this->auditLog->record('clearance_certificate.ethics_signed', $certificate, null, ['ethics_signed_by' => $signerId]);

        $this->maybeIssue($certificate->fresh());

        return $certificate->fresh();
    }

    private function ensureCertificate(ResearchApplication $researchApplication): ClearanceCertificate
    {
        return ClearanceCertificate::firstOrCreate(['research_application_id' => $researchApplication->id]);
    }

    private function maybeIssue(ClearanceCertificate $certificate): void
    {
        if (! $certificate->isFullySigned() || $certificate->isIssued()) {
            return;
        }

        $researchApplication = $certificate->researchApplication;

        $certificate->update([
            'issued_at' => now(),
            'valid_until' => $researchApplication->target_end_date,
            'qr_token' => Str::random(32),
        ]);

        $this->auditLog->record('clearance_certificate.issued', $certificate, null, ['issued_at' => now()->toIso8601String()]);

        $dpreq = DpreqApplication::where('research_application_id', $researchApplication->id)->first();
        if ($dpreq && $dpreq->canTransitionTo('clearance_issued')) {
            $this->transitionToClearanceIssued($dpreq);
        }

        $remis = RemisApplication::where('research_application_id', $researchApplication->id)->first();
        if ($remis && $remis->canTransitionTo('clearance_issued')) {
            $this->transitionToClearanceIssued($remis);
            $this->startMonitoring($remis->fresh());
        }

        $researchApplication->update(['overall_status' => 'clearance_issued']);

        // docs/1.2 + docs/3.3: "Clearance Issued (ready to download) -> Applicant/Researcher".
        // One notification, not one per track — it's the same joint clearance and the same
        // person (the applicant) either way. Linked to the DPREQ record (not the certificate
        // itself, which has no standalone show page) so clicking the notification goes somewhere.
        $this->notifications->notifyUser($researchApplication->applicant, 'Joint clearance issued', "Your joint clearance for \"{$researchApplication->research_title}\" has been issued and is ready to download.", $researchApplication->dpreqApplication);

        GenerateJointClearancePdfJob::dispatch($certificate->id);
    }

    private function transitionToClearanceIssued(DpreqApplication|RemisApplication $application): void
    {
        $fromStatus = $application->status;
        $application->update(['status' => 'clearance_issued']);
        $this->statusHistory->record($application, $fromStatus, 'clearance_issued');
        $this->auditLog->record(
            $application instanceof DpreqApplication ? 'dpreq_application.clearance_issued' : 'remis_application.clearance_issued',
            $application,
            ['status' => $fromStatus],
            ['status' => 'clearance_issued'],
        );
    }

    // docs/3.4-remis-monitoring-archiving.md — the FRS never describes a manual "start
    // monitoring" action, so this ASSUMES monitoring begins automatically the moment clearance
    // is issued (there's nothing else gating the start of study execution). DPREQ has no
    // equivalent: its track ends at `clearance_issued` (DpreqApplication::LEGAL_TRANSITIONS).
    private function startMonitoring(RemisApplication $remis): void
    {
        $fromStatus = $remis->status;
        $remis->update(['status' => 'monitoring']);
        $this->statusHistory->record($remis, $fromStatus, 'monitoring');
        $this->auditLog->record('remis_application.monitoring_started', $remis, ['status' => $fromStatus], ['status' => 'monitoring']);
    }
}
