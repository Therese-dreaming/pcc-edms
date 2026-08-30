<?php

namespace App\Shared\Clearance\Services;

use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\Clearance\Jobs\GenerateDpreqClearancePdfJob;
use App\Shared\Clearance\Jobs\GenerateRemisClearancePdfJob;
use App\Shared\Clearance\Jobs\GenerateRemisExemptionPdfJob;
use App\Shared\Clearance\Models\ClearanceCertificate;
use App\Shared\Documents\Services\RetentionService;
use App\Shared\Notifications\Services\NotificationService;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// docs/0.4-dpo-ethics-integration.md — the DPO <-> Ethics integration point. As of
// stakeholder-additional-features.md (2026-07-25) the two departments issue INDEPENDENT
// certificates: signDpoTrack() issues the DPREQ clearance the moment DPO approves;
// signEthicsTrack() issues the REMIS clearance the moment Ethics decides. Neither waits for the
// other, and there is no joint dual-signed release gate anymore. Both DpreqWorkflowService and
// RemisWorkflowService still depend only on this shared service, never on each other
// (system-design.md §4's module-boundary rule).
class ClearanceService
{
    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
        private readonly NotificationService $notifications,
        private readonly CertificateNumberService $certificateNumbers,
        private readonly RetentionService $retention,
    ) {
    }

    // DPO track — issued independently on DPO approval (no dependency on the Ethics track).
    public function signDpoTrack(ResearchApplication $researchApplication, int $signerId): ClearanceCertificate
    {
        $this->ensureCertificate($researchApplication);

        return DB::transaction(function () use ($researchApplication, $signerId) {
            $certificate = ClearanceCertificate::lockForUpdate()
                ->where('research_application_id', $researchApplication->id)
                ->firstOrFail();

            if ($certificate->isDpreqIssued()) {
                return $certificate; // idempotent — never re-issue or hand out a second control number
            }

            $certificate->update([
                'dpreq_certificate_number' => $this->certificateNumbers->next('DPREQ'),
                'dpo_signed_by' => $signerId,
                'dpo_signed_at' => now(),
                'dpreq_issued_at' => now(),
                'dpreq_valid_until' => $researchApplication->target_end_date,
                'dpreq_qr_token' => Str::random(32),
            ]);
            $certificate = $certificate->fresh();

            $this->auditLog->record('clearance_certificate.dpreq_issued', $certificate, null, [
                'dpo_signed_by' => $signerId,
                'dpreq_certificate_number' => $certificate->dpreq_certificate_number,
            ]);

            $dpreq = DpreqApplication::where('research_application_id', $researchApplication->id)->first();
            if ($dpreq && $dpreq->canTransitionTo('clearance_issued')) {
                $this->transitionToClearanceIssued($dpreq, $signerId);
            }

            $this->refreshOverallStatus($researchApplication->fresh(), $certificate);

            // stakeholder-additional-features.md — superseded submissions are archived once the
            // clearance issues; the approved version stays current.
            $this->retention->archiveForIssuedClearance($researchApplication, 'dpo');

            // docs/1.2 "Clearance Issued (ready to download) -> Applicant". Linked to the DPREQ record
            // (the certificate itself has no standalone show page).
            $this->notifications->notifyUser(
                $researchApplication->applicant,
                'DPO clearance issued',
                "Your Data Privacy (DPREQ) clearance for \"{$researchApplication->research_title}\" has been issued (Control No. {$certificate->dpreq_certificate_number}) and is ready to download.",
                $researchApplication->dpreqApplication,
            );

            GenerateDpreqClearancePdfJob::dispatch($certificate->id);

            return $certificate;
        });
    }

    // Ethics track — issued independently on the Ethics decision (no dependency on the DPO track).
    // `$exempted` issues a Certificate of Exemption instead of a full Research Ethics Clearance
    // (stakeholder 2026-07-28); both carry a REMIS control number and QR verification.
    public function signEthicsTrack(ResearchApplication $researchApplication, int $signerId, bool $exempted = false): ClearanceCertificate
    {
        $this->ensureCertificate($researchApplication);

        return DB::transaction(function () use ($researchApplication, $signerId, $exempted) {
            $certificate = ClearanceCertificate::lockForUpdate()
                ->where('research_application_id', $researchApplication->id)
                ->firstOrFail();

            if ($certificate->isRemisIssued()) {
                return $certificate; // idempotent
            }

            $certificate->update([
                'remis_certificate_number' => $this->certificateNumbers->next('REMIS'),
                'remis_certificate_kind' => $exempted ? 'exemption' : 'clearance',
                'ethics_signed_by' => $signerId,
                'ethics_signed_at' => now(),
                'remis_issued_at' => now(),
                'remis_valid_until' => $researchApplication->target_end_date,
                'remis_qr_token' => Str::random(32),
            ]);
            $certificate = $certificate->fresh();

            $this->auditLog->record('clearance_certificate.remis_issued', $certificate, null, [
                'ethics_signed_by' => $signerId,
                'remis_certificate_number' => $certificate->remis_certificate_number,
                'remis_certificate_kind' => $certificate->remis_certificate_kind,
            ]);

            $remis = RemisApplication::where('research_application_id', $researchApplication->id)->first();
            if ($remis && $remis->canTransitionTo('clearance_issued')) {
                $this->transitionToClearanceIssued($remis, $signerId);
                // Only cleared studies enter monthly monitoring (docs/3.4). An exempted study is
                // excused from full ethics clearance — and from the monitoring that follows it —
                // so it rests at clearance_issued with no progress-report obligation.
                if (! $exempted) {
                    $this->startMonitoring($remis->fresh(), $signerId);
                }
            }

            $this->refreshOverallStatus($researchApplication->fresh(), $certificate);

            $this->retention->archiveForIssuedClearance($researchApplication, 'ethics');

            $label = $exempted ? 'exemption' : 'clearance';
            $title = $exempted ? 'Ethics exemption issued' : 'Ethics clearance issued';

            // docs/3.3 "Clearance Issued (ready to download) -> Researcher".
            $this->notifications->notifyUser(
                $researchApplication->applicant,
                $title,
                "Your Research Ethics (REMIS) {$label} for \"{$researchApplication->research_title}\" has been issued (Control No. {$certificate->remis_certificate_number}) and is ready to download.",
                $researchApplication->remisApplication,
            );

            if ($exempted) {
                GenerateRemisExemptionPdfJob::dispatch($certificate->id);
            } else {
                GenerateRemisClearancePdfJob::dispatch($certificate->id);
            }

            return $certificate;
        });
    }

    private function ensureCertificate(ResearchApplication $researchApplication): ClearanceCertificate
    {
        return ClearanceCertificate::firstOrCreate(['research_application_id' => $researchApplication->id]);
    }

    // With independent issuance, the shared research_application is only "clearance_issued" once
    // BOTH tracks have issued their own certificate; while just one side has issued it stays
    // "partially_cleared" so dashboards/reports can distinguish the half-done state.
    private function refreshOverallStatus(ResearchApplication $researchApplication, ClearanceCertificate $certificate): void
    {
        $status = match (true) {
            $certificate->isDpreqIssued() && $certificate->isRemisIssued() => 'clearance_issued',
            $certificate->isDpreqIssued() || $certificate->isRemisIssued() => 'partially_cleared',
            default => $researchApplication->overall_status,
        };

        if ($researchApplication->overall_status !== $status) {
            $researchApplication->update(['overall_status' => $status]);
        }
    }

    private function transitionToClearanceIssued(DpreqApplication|RemisApplication $application, int $actorId): void
    {
        $fromStatus = $application->status;
        $application->update(['status' => 'clearance_issued']);
        $this->statusHistory->record($application, $fromStatus, 'clearance_issued', null, $actorId);
        $this->auditLog->record(
            $application instanceof DpreqApplication ? 'dpreq_application.clearance_issued' : 'remis_application.clearance_issued',
            $application,
            ['status' => $fromStatus],
            ['status' => 'clearance_issued'],
        );
    }

    // docs/3.4-remis-monitoring-archiving.md — the FRS never describes a manual "start
    // monitoring" action, so this ASSUMES monitoring begins automatically the moment the REMIS
    // clearance is issued (there's nothing else gating the start of study execution). DPREQ has no
    // equivalent: its track ends at `clearance_issued` (DpreqApplication::LEGAL_TRANSITIONS).
    private function startMonitoring(RemisApplication $remis, int $actorId): void
    {
        $fromStatus = $remis->status;
        $remis->update(['status' => 'monitoring']);
        $this->statusHistory->record($remis, $fromStatus, 'monitoring', null, $actorId);
        $this->auditLog->record('remis_application.monitoring_started', $remis, ['status' => $fromStatus], ['status' => 'monitoring']);
    }
}
