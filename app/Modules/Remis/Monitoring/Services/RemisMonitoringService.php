<?php

namespace App\Modules\Remis\Monitoring\Services;

use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Monitoring\Models\CompletionReport;
use App\Modules\Remis\Monitoring\Models\ProgressReport;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\Notifications\Services\NotificationService;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use RuntimeException;

// docs/3.4-remis-monitoring-archiving.md FRS §XII/§XIV — periodic progress reports during
// `monitoring`, then the Final Ethics Completion Report that closes the study out.
//
// Known simplification vs. the FRS: FRS §XIV says the system closes-then-archives "on
// acceptance" of the Completion Report, but names no separate accept action or role — so
// submitCompletionReport() below treats submission itself as acceptance, closing and archiving
// in one step. If DPO/ORD later want a review gate before archiving (e.g. Ethics Secretariat
// signs off first), that's a new intermediate status between `monitoring` and `closed`, not a
// change to this method's two calls.
//
// Also not built, by decision rather than by gap: a `discontinued`/`withdrawn` early-exit path.
// `completion_reports.final_outcome` keeps those enum values for schema forward-compatibility,
// but the requester confirmed (docs/HANDOFF.md Part G) this isn't needed — a stalled study can
// just stay in `monitoring` indefinitely. Revisit only if this becomes a real recurring case.
//
// docs/3.3's "Notification Trigger Summary" predates this module (3.4 was split out later — see
// CHANGELOG.md) and doesn't name triggers for it. The notifications below are an inferred
// extension, following the same "notify whoever needs to act next" pattern used throughout
// docs/1.2/2.2/3.3, not a literal doc requirement.
class RemisMonitoringService
{
    // docs/HANDOFF.md Part G — docs/3.4 left the progress-report cadence as an unconfirmed
    // ASSUMPTION ("every 6 months?"); the requester confirmed monthly, since most studies here
    // finish in 3-4 months anyway. Single source of truth for "overdue" — used by the ORD
    // dashboard's Overdue Monitoring widget, not stored as a column anywhere.
    private const MONITORING_CADENCE_MONTHS = 1;

    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
        private readonly NotificationService $notifications,
    ) {
    }

    /**
     * Next progress-report due date: one cadence period after the later of the last submitted
     * progress report, or when the study entered `monitoring` if none has been submitted yet.
     */
    public function monitoringDueDate(RemisApplication $application): CarbonInterface
    {
        $lastReportAt = $application->progressReports->max('submitted_at');

        if ($lastReportAt) {
            return $lastReportAt->copy()->addMonths(self::MONITORING_CADENCE_MONTHS);
        }

        $monitoringStarted = $application->statusHistory->firstWhere('to_status', 'monitoring');
        $anchor = $monitoringStarted?->created_at ?? $application->updated_at;

        return $anchor->copy()->addMonths(self::MONITORING_CADENCE_MONTHS);
    }

    public function isMonitoringOverdue(RemisApplication $application): bool
    {
        return $application->status === 'monitoring' && $this->monitoringDueDate($application)->isPast();
    }

    public function submitProgressReport(RemisApplication $application, array $data, int $researcherId): ProgressReport
    {
        if ($application->status !== 'monitoring') {
            throw new RuntimeException('Progress reports can only be submitted while the study is in Monitoring.');
        }

        $report = ProgressReport::create([
            'remis_application_id' => $application->id,
            'submitted_by' => $researcherId,
            'status_of_study' => $data['status_of_study'],
            'participants_recruited' => $data['participants_recruited'],
            'ethics_concerns' => $data['ethics_concerns'] ?? null,
            'protocol_deviations' => $data['protocol_deviations'] ?? null,
            'corrective_actions' => $data['corrective_actions'] ?? null,
            'submitted_at' => now(),
        ]);

        $this->auditLog->record('remis_application.progress_report_submitted', $report, null, $report->toArray());

        // docs/HANDOFF.md Part G — a panel, not a single reviewer; notify everyone assigned.
        foreach ($application->reviewAssignments as $assignment) {
            $this->notifications->notifyUser($assignment->reviewer, 'New progress report submitted', "A new progress report was submitted for REMIS application {$application->tracking_number}.", $application);
        }

        return $report;
    }

    public function reviewProgressReport(ProgressReport $report, string $complianceStatus, ?string $notes, int $reviewerId): ProgressReport
    {
        if ($report->reviewed_at !== null) {
            throw new RuntimeException('This progress report has already been reviewed.');
        }

        $report->update([
            'compliance_status' => $complianceStatus,
            'review_notes' => $notes,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);

        $this->auditLog->record('remis_application.progress_report_reviewed', $report, null, [
            'compliance_status' => $complianceStatus,
        ]);

        $report = $report->fresh();
        $this->notifications->notifyUser($report->submitter, 'Progress report reviewed', "Your progress report for {$report->remisApplication->tracking_number} was reviewed: {$complianceStatus}.", $report->remisApplication);

        return $report;
    }

    public function submitCompletionReport(RemisApplication $application, array $data, int $researcherId): CompletionReport
    {
        if ($application->status !== 'monitoring') {
            throw new RuntimeException('A completion report can only be submitted while the study is in Monitoring.');
        }

        return DB::transaction(function () use ($application, $data, $researcherId) {
            $completion = CompletionReport::create([
                'remis_application_id' => $application->id,
                'completion_date' => $data['completion_date'],
                'final_participant_count' => $data['final_participant_count'],
                'compliance_statement' => $data['compliance_statement'],
                'publication_status' => $data['publication_status'],
                'data_storage_location' => $data['data_storage_location'],
                'final_outcome' => 'completed',
                'submitted_by' => $researcherId,
            ]);

            $this->auditLog->record('remis_application.completion_report_submitted', $completion, null, $completion->toArray());

            $this->transition($application, 'closed', 'remis_application.closed');
            $this->transition($application->fresh(), 'archived', 'remis_application.archived');

            $completion->update(['archived_at' => now()]);
            $application = $application->fresh();
            $this->auditLog->record('remis_application.archived', $application, null, ['archived_at' => now()->toIso8601String()]);

            $this->notifications->notifyUser($application->applicant, 'Study closed and archived', "REMIS application {$application->tracking_number} is now closed and archived.", $application);
            foreach ($application->reviewAssignments as $assignment) {
                $this->notifications->notifyUser($assignment->reviewer, 'Study closed and archived', "REMIS application {$application->tracking_number} is now closed and archived.", $application);
            }

            return $completion->fresh();
        });
    }

    private function transition(RemisApplication $application, string $toStatus, string $eventType): void
    {
        DB::transaction(function () use ($application, $toStatus, $eventType) {
            $locked = RemisApplication::lockForUpdate()->findOrFail($application->id);

            if (! $locked->canTransitionTo($toStatus)) {
                throw new RuntimeException("Illegal REMIS transition: {$locked->status} -> {$toStatus}.");
            }

            $fromStatus = $locked->status;
            $locked->update(['status' => $toStatus]);

            $this->statusHistory->record($locked, $fromStatus, $toStatus);
            $this->auditLog->record($eventType, $locked, ['status' => $fromStatus], ['status' => $toStatus]);
        });
    }
}
