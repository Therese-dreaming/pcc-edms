<?php

namespace App\Modules\Remis\Services;

use App\Modules\Remis\Models\Decision;
use App\Modules\Remis\Models\EndorsementAction;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Models\ReviewAssignment;
use App\Modules\Remis\Models\RiskClassification;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\Clearance\Services\ClearanceService;
use App\Shared\Notifications\Services\NotificationService;
use RuntimeException;

// docs/3.3-remis-review-workflow.md — enforces the Ethics track's legal status transitions
// (RemisApplication::LEGAL_TRANSITIONS), same pattern as Modules\Dpreq\Services\DpreqWorkflowService.
//
// Known simplification vs. the FRS: risk classification (FRS §VII, "performed by Ethics
// Reviewer") and review-recommendation submission (FRS §VIII) are combined into one action by
// each assigned reviewer here, since the FRS's own text has the Chair assigning a reviewer
// "based on risk track" while also having the reviewer perform the classification — the two
// naturally collapse into "the assigned reviewer both classifies and recommends."
//
// docs/HANDOFF.md Part G — multi-reviewer panel confirmed with the requester: the Chair can
// assign a panel of reviewers (not just one), each submits their own recommendation on their own
// `review_assignments` row, and decide() requires every assigned reviewer to have submitted
// before the Chair can consolidate into one Decision. `RiskClassification` still has no
// consolidation logic across reviewers — `RemisApplication::riskClassification()` is
// `latestOfMany()`, so if reviewers disagree on risk level, whichever classified most recently
// wins. The FRS doesn't describe how to reconcile disagreeing risk classifications, so this is
// left as-is rather than guessed at.
class RemisWorkflowService
{
    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
        private readonly ClearanceService $clearance,
        private readonly NotificationService $notifications,
    ) {
    }

    public function submit(RemisApplication $application): RemisApplication
    {
        $application = $this->transition($application, 'under_endorsement', 'remis_application.submitted');
        $application->update(['current_endorsement_step' => 'adviser']);

        // docs/3.3 "Notifications": Submission received -> Researcher + Adviser.
        $this->notifications->notifyUser($application->applicant, 'REMIS application submitted', "Your REMIS application {$application->tracking_number} was submitted for endorsement.", $application);
        $this->notifications->notifyRole('adviser', 'REMIS application awaiting endorsement', "REMIS application {$application->tracking_number} is awaiting your endorsement.", $application);

        return $application->fresh();
    }

    public function endorse(
        RemisApplication $application,
        string $step,
        int $endorserId,
        string $action,
        ?string $remarks,
        ?string $signature,
        ?string $signatureImage = null,
    ): RemisApplication {
        if ($application->status !== 'under_endorsement' || $application->current_endorsement_step !== $step) {
            throw new RuntimeException("It is not currently the {$step}'s turn to endorse this application.");
        }

        EndorsementAction::create([
            'remis_application_id' => $application->id,
            'step' => $step,
            'endorser_id' => $endorserId,
            'action' => $action,
            'remarks' => $remarks,
            'signature_id' => $signature,
            'signature_image' => $signatureImage,
            'acted_at' => now(),
        ]);

        $this->auditLog->record("remis_application.endorsement_{$action}", $application, null, [
            'step' => $step, 'action' => $action,
        ]);

        if ($action === 'reject') {
            $application = $this->transition($application, 'disapproved', 'remis_application.disapproved', $remarks);

            // Not an explicit docs/3.3 trigger line, but the applicant clearly needs to know
            // their study was disapproved during endorsement — same treatment as decide()'s
            // "Decision issued -> Researcher" for the formal decision later in the pipeline.
            $this->notifications->notifyUser($application->applicant, 'REMIS application disapproved', "REMIS application {$application->tracking_number} was disapproved during endorsement: \"{$remarks}\"", $application);

            return $application;
        }

        if ($action === 'return') {
            $application->update(['returned_from_status' => 'under_endorsement']);

            $application = $this->transition($application, 'for_revision', 'remis_application.for_revision', $remarks);

            // docs/3.3: For Revision (from any stage) -> Researcher.
            $this->notifications->notifyUser($application->applicant, 'REMIS application returned for revision', "REMIS application {$application->tracking_number} was returned: \"{$remarks}\"", $application);

            return $application;
        }

        // approve: advance to next step, or if Dean just approved, move to screening.
        $nextStep = match ($step) {
            'adviser' => 'program_head',
            'program_head' => 'dean',
            'dean' => null,
        };

        if ($nextStep === null) {
            $application->update(['current_endorsement_step' => null]);

            $application = $this->transition($application, 'for_screening', 'remis_application.endorsement_complete');

            // docs/3.3: Routed to Ethics Secretariat -> Ethics Secretariat.
            $this->notifications->notifyRole('ethics_secretariat', 'REMIS application ready for screening', "REMIS application {$application->tracking_number} completed endorsement and is ready for screening.", $application);

            return $application;
        }

        $application->update(['current_endorsement_step' => $nextStep]);

        // docs/3.3: Endorsement step advanced -> Researcher + next endorser.
        $this->notifications->notifyUser($application->applicant, 'REMIS endorsement advanced', "REMIS application {$application->tracking_number} advanced to the {$nextStep} endorsement step.", $application);
        $this->notifications->notifyRole($nextStep, 'REMIS application awaiting endorsement', "REMIS application {$application->tracking_number} is awaiting your endorsement.", $application);

        return $application->fresh();
    }

    public function resubmitFromRevision(RemisApplication $application): RemisApplication
    {
        $target = $application->returned_from_status ?? 'under_endorsement';

        if ($target === 'under_endorsement') {
            $application->update(['current_endorsement_step' => 'adviser']);
        }

        $application->update(['returned_from_status' => null]);

        $application = $this->transition($application, $target, 'remis_application.resubmitted');

        // Whoever's turn it is next needs to know a revision came back in, mirroring docs/3.3's
        // "Routed to X -> X" pattern for the same target statuses reached via the forward path.
        match ($target) {
            'under_endorsement' => $this->notifications->notifyRole('adviser', 'REMIS application resubmitted', "REMIS application {$application->tracking_number} was resubmitted and is awaiting endorsement.", $application),
            'for_screening' => $this->notifications->notifyRole('ethics_secretariat', 'REMIS application resubmitted', "REMIS application {$application->tracking_number} was resubmitted and is ready for screening.", $application),
            'for_review' => $this->notifications->notifyRole('ethics_reviewer', 'REMIS application resubmitted', "REMIS application {$application->tracking_number} was resubmitted and is ready for review.", $application),
            default => null,
        };

        return $application;
    }

    public function screen(RemisApplication $application, string $decision, ?string $comments = null): RemisApplication
    {
        return match ($decision) {
            'complete' => (function () use ($application) {
                $application = $this->transition($application, 'for_review', 'remis_application.screening_complete');

                // docs/3.3: Routed to Ethics Reviewer(s) -> Ethics Reviewer(s). No specific
                // reviewer is assigned yet (that's assignReviewer(), a separate step owned by the
                // Chair) — this is a heads-up to the role that a study has entered the queue.
                $this->notifications->notifyRole('ethics_reviewer', 'REMIS application ready for review', "REMIS application {$application->tracking_number} passed screening and is ready for review assignment.", $application);

                return $application;
            })(),
            'incomplete', 'returned_for_compliance' => (function () use ($application, $comments) {
                $application->update(['returned_from_status' => 'for_screening']);

                $application = $this->transition($application, 'for_revision', 'remis_application.screening_deficient', $comments);

                // docs/3.3: For Revision (from any stage) -> Researcher.
                $this->notifications->notifyUser($application->applicant, 'REMIS application returned for revision', "REMIS application {$application->tracking_number} was returned during screening: \"{$comments}\"", $application);

                return $application;
            })(),
            default => throw new RuntimeException("Unknown screening decision: {$decision}"),
        };
    }

    public function assignReviewer(RemisApplication $application, int $reviewerId): ReviewAssignment
    {
        if ($application->reviewAssignments()->where('reviewer_id', $reviewerId)->exists()) {
            throw new RuntimeException('This reviewer is already assigned to this application.');
        }

        $assignment = ReviewAssignment::create([
            'remis_application_id' => $application->id,
            'reviewer_id' => $reviewerId,
            'assigned_at' => now(),
        ]);

        $this->auditLog->record('remis_application.reviewer_assigned', $application, null, ['reviewer_id' => $reviewerId]);

        // Not its own docs/3.3 trigger line (the doc only names the role-wide "Routed to Ethics
        // Reviewer(s)" notification in screen() above), but the assigned reviewer specifically
        // needs to know it's now their study to review.
        $this->notifications->notifyUser($assignment->reviewer, 'REMIS reviewer assignment', "You were assigned to review REMIS application {$application->tracking_number}.", $application);

        return $assignment;
    }

    public function classifyRiskAndRecommend(
        ReviewAssignment $assignment,
        string $riskLevel,
        string $rationale,
        string $recommendation,
        string $comments,
    ): void {
        $application = $assignment->remisApplication;

        RiskClassification::create([
            'remis_application_id' => $application->id,
            'level' => $riskLevel,
            'review_type' => RiskClassification::LEVEL_TO_REVIEW_TYPE[$riskLevel],
            'classified_by' => $assignment->reviewer_id,
            'classification_date' => now()->toDateString(),
            'rationale' => $rationale,
        ]);

        $assignment->update([
            'recommendation' => $recommendation,
            'comments' => $comments,
            'submitted_at' => now(),
        ]);

        $this->auditLog->record('remis_application.reviewed', $application, null, [
            'risk_level' => $riskLevel, 'recommendation' => $recommendation,
        ]);
    }

    public function decide(
        RemisApplication $application,
        string $outcome,
        int $chairId,
        ?string $conditions,
        ?string $remarks,
        ?string $signature,
        ?string $signatureImage = null,
    ): RemisApplication {
        if (! $application->canTransitionTo($outcome)) {
            throw new RuntimeException("Illegal REMIS transition: {$application->status} -> {$outcome}.");
        }

        $assignments = $application->reviewAssignments()->get();

        if ($assignments->isEmpty() || $assignments->contains(fn (ReviewAssignment $a) => $a->submitted_at === null)) {
            throw new RuntimeException('All assigned reviewers must submit their recommendation before a decision can be issued.');
        }

        Decision::create([
            'remis_application_id' => $application->id,
            'outcome' => $outcome,
            'decided_by' => $chairId,
            'decision_date' => now()->toDateString(),
            'conditions' => $conditions,
            'remarks' => $remarks,
            'signature_id' => $signature,
            'signature_image' => $signatureImage,
        ]);

        $application = $this->transition($application, $outcome, "remis_application.decision_{$outcome}", $remarks);

        // docs/3.3: Decision issued (any of the four outcomes) -> Researcher.
        $this->notifications->notifyUser($application->applicant, 'REMIS decision issued', "REMIS application {$application->tracking_number} decision: {$outcome}.", $application);

        if (in_array($outcome, ['approved', 'approved_with_conditions'], true)) {
            $this->clearance->signEthicsTrack($application->researchApplication, $chairId, $application->tracking_number);
        }

        return $application->fresh();
    }

    private function transition(RemisApplication $application, string $toStatus, string $eventType, ?string $comments = null): RemisApplication
    {
        if (! $application->canTransitionTo($toStatus)) {
            throw new RuntimeException("Illegal REMIS transition: {$application->status} -> {$toStatus}.");
        }

        $fromStatus = $application->status;
        $application->update(['status' => $toStatus]);

        $this->statusHistory->record($application, $fromStatus, $toStatus, $comments);
        $this->auditLog->record($eventType, $application, ['status' => $fromStatus], ['status' => $toStatus]);

        return $application->fresh();
    }
}
