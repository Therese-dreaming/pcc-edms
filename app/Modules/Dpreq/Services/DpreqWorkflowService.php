<?php

namespace App\Modules\Dpreq\Services;

use App\Modules\Dpreq\Models\DpreqApplication;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\Clearance\Services\ClearanceService;
use App\Shared\Notifications\Services\NotificationService;
use App\Shared\Revisions\Services\RevisionService;
use Illuminate\Support\Facades\DB;
use RuntimeException;

// docs/1.2-dpreq-workflow.md — enforces the DPO track's legal status transitions
// (DpreqApplication::LEGAL_TRANSITIONS). Every transition writes a status_history row and an
// audit_log row (docs/testing-strategy.md: "every legal transition succeeds and writes a
// status_history row"; "every illegal transition is rejected with a clear error, not silently
// allowed"). `Approved` creates the Research Team NDA and opens signing to the team; the DPO
// (DPREQ) clearance is issued later, by ResearchTeamNdaService, once every signatory has signed
// (concern 7, 2026-07-26) — approval itself no longer issues the clearance.
class DpreqWorkflowService
{
    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
        private readonly ClearanceService $clearance,
        private readonly NotificationService $notifications,
        private readonly RevisionService $revisions,
        private readonly ResearchTeamNdaService $researchTeamNda,
    ) {
    }

    public function submit(DpreqApplication $application, ?string $comments = null): DpreqApplication
    {
        $application = $this->transition($application, 'submitted', 'dpreq_application.submitted', $comments);

        // docs/1.2 "Notifications Triggered": Submission received -> Applicant + DPO Staff.
        $this->notifications->notifyUser($application->applicant, 'Application submitted', "Your DPREQ application {$application->tracking_number} was submitted.", $application);
        $this->notifications->notifyRole('dpo_staff', 'New DPREQ submission', "DPREQ application {$application->tracking_number} was submitted for review.", $application);

        return $application;
    }

    // DPO staff takes a submitted application under review (2026-07-25 collapse).
    public function startReview(DpreqApplication $application): DpreqApplication
    {
        return $this->transition($application, 'under_review', 'dpreq_application.under_review');
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
        // Same gate as REMIS's resubmitFromRevision(): don't let the application re-enter the
        // review queue while a mandatory revision/document request is still outstanding.
        if ($this->revisions->hasOutstandingMandatory($application)) {
            throw new RuntimeException('Cannot resubmit: there are outstanding required items you must still provide.');
        }

        $application = $this->transition($application, 'submitted', 'dpreq_application.resubmitted');

        $this->notifications->notifyRole('dpo_staff', 'DPREQ application resubmitted', "DPREQ application {$application->tracking_number} was resubmitted after correction.", $application);

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
        // Item 7 — the DPO can't approve while it is still waiting on a required document/revision
        // it asked the applicant for (shared FRS §IX mechanism).
        if ($this->revisions->hasOutstandingMandatory($application)) {
            throw new RuntimeException('Cannot approve: there are outstanding required items the applicant must still provide.');
        }

        // Approval no longer waits on a signed NDA (concern 7, 2026-07-26). Signing opens *after*
        // approval: 'approved' is a real resting state where the team signs the Research Team NDA,
        // and the DPO clearance issues only once everyone has signed (see below + ResearchTeamNdaService).
        $application = $this->transition($application, 'approved', 'dpreq_application.approved');
        $application->update(['approved_by' => $approverId]);

        // Materialise the Research Team NDA now: the lead applicant becomes the 'leader' signatory
        // (signs while logged in) and every co-researcher captured at Form 1 is added as a member
        // and emailed a single-use signing link.
        $researchApplication = $application->researchApplication;
        $nda = $this->researchTeamNda->createForApplication($researchApplication);
        foreach ($researchApplication->co_researchers ?? [] as $member) {
            $this->researchTeamNda->addMember($nda, $member['full_name'], $member['email']);
        }

        // docs/1.2: Approved / Rejected -> Applicant. Signing (not the clearance) is the next step.
        // Sent synchronously (notifyUserSync): this is the "your NDA is ready to sign" heads-up
        // the leader actively waits on, so it must not be stranded by a missing queue worker —
        // same reasoning as the co-researcher invitation mails sent just above (concern 6 / A2).
        $this->notifications->notifyUserSync(
            $application->applicant,
            'Application approved — sign the Team NDA',
            "DPREQ application {$application->tracking_number} was approved. The clearance will be issued once you and all co-researchers have signed the Research Team NDA.",
            $application,
        );

        return $application->fresh();
    }

    private function transition(
        DpreqApplication $application,
        string $toStatus,
        string $eventType,
        ?string $comments = null,
    ): DpreqApplication {
        return DB::transaction(function () use ($application, $toStatus, $eventType, $comments) {
            $locked = DpreqApplication::lockForUpdate()->findOrFail($application->id);

            if (! $locked->canTransitionTo($toStatus)) {
                throw new RuntimeException(
                    "Illegal DPREQ transition: {$locked->status} -> {$toStatus}."
                );
            }

            $fromStatus = $locked->status;
            $locked->update(['status' => $toStatus]);

            $this->statusHistory->record($locked, $fromStatus, $toStatus, $comments);
            $this->auditLog->record($eventType, $locked, ['status' => $fromStatus], ['status' => $toStatus]);

            return $locked->fresh();
        });
    }
}
