<?php

namespace App\Modules\Dpreq\Services;

use App\Modules\Dpreq\Models\DpreqApplication;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\Clearance\Services\ClearanceService;
use App\Shared\Notifications\Services\NotificationService;
use RuntimeException;

// docs/1.2-dpreq-workflow.md — enforces the DPO track's legal status transitions
// (DpreqApplication::LEGAL_TRANSITIONS). Every transition writes a status_history row and an
// audit_log row (docs/testing-strategy.md: "every legal transition succeeds and writes a
// status_history row"; "every illegal transition is rejected with a clear error, not silently
// allowed"). `Approved` additionally enforces docs/0.4's Research Team NDA gate and signs the
// DPO half of the joint clearance (ClearanceService) — the actual `clearance_issued` transition
// happens inside ClearanceService, not here, since it depends on the Ethics track too.
class DpreqWorkflowService
{
    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
        private readonly ClearanceService $clearance,
        private readonly NotificationService $notifications,
    ) {
    }

    public function submit(DpreqApplication $application, ?string $comments = null): DpreqApplication
    {
        $application = $this->transition($application, 'submitted', 'dpreq_application.submitted', $comments);

        // docs/1.2 "Notifications Triggered": Submission received -> Applicant + DPO Staff.
        $this->notifications->notifyUser($application->applicant, 'Application submitted', "Your DPREQ application {$application->tracking_number} was submitted.", $application);
        $this->notifications->notifyRole('dpo_staff', 'New DPREQ submission', "DPREQ application {$application->tracking_number} was submitted for screening.", $application);

        return $application;
    }

    public function startScreening(DpreqApplication $application): DpreqApplication
    {
        return $this->transition($application, 'screening', 'dpreq_application.screening_started');
    }

    public function returnForCorrection(DpreqApplication $application, string $comments): DpreqApplication
    {
        $application = $this->transition($application, 'returned', 'dpreq_application.returned', $comments);

        // docs/1.2: Returned for correction -> Applicant.
        $this->notifications->notifyUser($application->applicant, 'Application returned for correction', "DPREQ application {$application->tracking_number} was returned: \"{$comments}\"", $application);

        return $application;
    }

    public function resubmit(DpreqApplication $application): DpreqApplication
    {
        $application = $this->transition($application, 'submitted', 'dpreq_application.resubmitted');

        $this->notifications->notifyRole('dpo_staff', 'DPREQ application resubmitted', "DPREQ application {$application->tracking_number} was resubmitted after correction.", $application);

        return $application;
    }

    public function passScreeningToReview(DpreqApplication $application): DpreqApplication
    {
        return $this->transition($application, 'under_review', 'dpreq_application.under_review');
    }

    public function endorse(DpreqApplication $application, ?string $comments = null): DpreqApplication
    {
        $application = $this->transition($application, 'endorsed', 'dpreq_application.endorsed', $comments);

        // docs/1.2: Endorsed -> DPO Approver.
        $this->notifications->notifyRole('dpo_approver', 'DPREQ application ready for approval', "DPREQ application {$application->tracking_number} was endorsed and is awaiting approval.", $application);

        return $application;
    }

    public function reject(DpreqApplication $application, string $reason): DpreqApplication
    {
        $application = $this->transition($application, 'rejected', 'dpreq_application.rejected', $reason);

        // docs/1.2: Approved / Rejected -> Applicant.
        $this->notifications->notifyUser($application->applicant, 'Application rejected', "DPREQ application {$application->tracking_number} was rejected: \"{$reason}\"", $application);

        return $application;
    }

    public function approve(DpreqApplication $application, int $approverId): DpreqApplication
    {
        $nda = $application->researchApplication->researchTeamNda;

        if ($nda === null || ! $nda->isFullySigned()) {
            throw new RuntimeException(
                'Cannot approve: the Research Team NDA (Form 2) must be fully signed first (docs/0.4-dpo-ethics-integration.md).'
            );
        }

        $application = $this->transition($application, 'approved', 'dpreq_application.approved');

        // docs/1.2: Approved / Rejected -> Applicant.
        $this->notifications->notifyUser($application->applicant, 'Application approved', "DPREQ application {$application->tracking_number} was approved.", $application);

        $this->clearance->signDpoTrack($application->researchApplication, $approverId, $application->tracking_number);

        return $application->fresh();
    }

    private function transition(
        DpreqApplication $application,
        string $toStatus,
        string $eventType,
        ?string $comments = null,
    ): DpreqApplication {
        if (! $application->canTransitionTo($toStatus)) {
            throw new RuntimeException(
                "Illegal DPREQ transition: {$application->status} -> {$toStatus}."
            );
        }

        $fromStatus = $application->status;
        $application->update(['status' => $toStatus]);

        $this->statusHistory->record($application, $fromStatus, $toStatus, $comments);
        $this->auditLog->record($eventType, $application, ['status' => $fromStatus], ['status' => $toStatus]);

        return $application->fresh();
    }
}
