<?php

namespace App\Modules\Remis\Services;

use App\Modules\Remis\Models\Decision;
use App\Modules\Remis\Models\EndorsementAction;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Models\ReviewAssignment;
use App\Modules\Remis\Models\RiskClassification;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\AuditLog\Support\SignatureIdentity;
use App\Shared\Clearance\Services\ClearanceService;
use App\Shared\Revisions\Services\RevisionService;
use App\Shared\Notifications\Services\NotificationService;
use Illuminate\Support\Facades\DB;
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
        private readonly RevisionService $revisions,
    ) {
    }

    public function submit(RemisApplication $application): RemisApplication
    {
        $application = $this->transition($application, 'under_endorsement', 'remis_application.submitted');
        $application->update(['current_endorsement_step' => 'adviser']);

        // docs/3.3 "Notifications": Submission received -> Researcher + Adviser.
        $this->notifications->notifyUser($application->applicant, 'REMIS application submitted', "Your REMIS application {$application->tracking_number} was submitted for endorsement.", $application);
        $this->notifyAdviser($application, 'REMIS application awaiting endorsement', "REMIS application {$application->tracking_number} is awaiting your endorsement.");

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
        // Lock the application row BEFORE checking status/step and creating the EndorsementAction.
        // Without this, two concurrent approvals at the same step could both pass the check and both
        // create EndorsementAction rows, effectively skipping the next endorser in the chain.
        return DB::transaction(function () use ($application, $step, $endorserId, $action, $remarks, $signature, $signatureImage) {
            $locked = RemisApplication::lockForUpdate()->findOrFail($application->id);

            if ($locked->status !== 'under_endorsement' || $locked->current_endorsement_step !== $step) {
                throw new RuntimeException("It is not currently the {$step}'s turn to endorse this application.");
            }

            $identity = SignatureIdentity::capture();

            EndorsementAction::create([
                'remis_application_id' => $locked->id,
                'step' => $step,
                'endorser_id' => $endorserId,
                'action' => $action,
                'remarks' => $remarks,
                'signature_id' => $signature,
                'signature_image' => $signatureImage,
                'signature_ip' => $identity['ip'],
                'signature_user_agent' => $identity['user_agent'],
                'acted_at' => now(),
            ]);

            $this->auditLog->record("remis_application.endorsement_{$action}", $locked, null, [
                'step' => $step, 'action' => $action,
            ]);

            if ($action === 'reject') {
                $locked = $this->transition($locked, 'disapproved', 'remis_application.disapproved', $remarks);

                $this->notifications->notifyUser($locked->applicant, 'REMIS application disapproved', "REMIS application {$locked->tracking_number} was disapproved during endorsement: \"{$remarks}\"", $locked);

                return $locked;
            }

            if ($action === 'return') {
                $locked->update(['returned_from_status' => 'under_endorsement']);

                $locked = $this->transition($locked, 'for_revision', 'remis_application.for_revision', $remarks);

                $this->notifications->notifyUser($locked->applicant, 'REMIS application returned for revision', "REMIS application {$locked->tracking_number} was returned: \"{$remarks}\"", $locked);

                return $locked;
            }

            // approve: advance to next step, or if Dean just approved, move to screening.
            $nextStep = match ($step) {
                'adviser' => 'program_head',
                'program_head' => 'dean',
                'dean' => null,
            };

            if ($nextStep === null) {
                $locked->update(['current_endorsement_step' => null]);

                $locked = $this->transition($locked, 'for_screening', 'remis_application.endorsement_complete');

                $this->notifications->notifyRole('ethics_secretariat', 'REMIS application ready for screening', "REMIS application {$locked->tracking_number} completed endorsement and is ready for screening.", $locked);

                return $locked;
            }

            $locked->update(['current_endorsement_step' => $nextStep]);

            $this->notifications->notifyUser($locked->applicant, 'REMIS endorsement advanced', "REMIS application {$locked->tracking_number} advanced to the {$nextStep} endorsement step.", $locked);
            $this->notifications->notifyRole($nextStep, 'REMIS application awaiting endorsement', "REMIS application {$locked->tracking_number} is awaiting your endorsement.", $locked);

            return $locked->fresh();
        });
    }

    public function resubmitFromRevision(RemisApplication $application): RemisApplication
    {
        // FRS §IX gate: an application can't be pushed back into the workflow while a mandatory
        // revision request is still outstanding.
        if ($this->revisions->hasOutstandingMandatory($application)) {
            throw new RuntimeException('Please resolve all required revision items before resubmitting.');
        }

        $target = $application->returned_from_status ?? 'under_endorsement';

        if ($target === 'under_endorsement') {
            $application->update(['current_endorsement_step' => 'adviser']);
        }

        $application->update(['returned_from_status' => null]);

        $application = $this->transition($application, $target, 'remis_application.resubmitted');

        // Whoever's turn it is next needs to know a revision came back in, mirroring docs/3.3's
        // "Routed to X -> X" pattern for the same target statuses reached via the forward path.
        match ($target) {
            'under_endorsement' => $this->notifyAdviser($application, 'REMIS application resubmitted', "REMIS application {$application->tracking_number} was resubmitted and is awaiting endorsement."),
            'for_screening' => $this->notifications->notifyRole('ethics_secretariat', 'REMIS application resubmitted', "REMIS application {$application->tracking_number} was resubmitted and is ready for screening.", $application),
            'for_review' => $this->notifications->notifyRole('ethics_reviewer', 'REMIS application resubmitted', "REMIS application {$application->tracking_number} was resubmitted and is ready for review.", $application),
            default => null,
        };

        return $application;
    }

    /**
     * FRS §VI Administrative Screening. `$checklist` holds the five completeness booleans; it is
     * recorded per screening, and on a deficient outcome a deficiency notice PDF is auto-generated.
     *
     * @param  array<string, bool>  $checklist
     */
    public function screen(RemisApplication $application, string $decision, ?string $comments = null, array $checklist = [], ?int $screenedBy = null): RemisApplication
    {
        // Validate the status BEFORE creating the checklist row — otherwise a failed transition
        // leaves an orphaned screening_checklists record (the transition throws, the create doesn't
        // roll back because it happened outside any wrapping transaction).
        if (! $application->canTransitionTo(match ($decision) {
            'complete' => 'for_review',
            'incomplete', 'returned_for_compliance' => 'for_revision',
            default => throw new RuntimeException("Unknown screening decision: {$decision}"),
        })) {
            throw new RuntimeException("Illegal REMIS transition: {$application->status} -> screening outcome '{$decision}'.");
        }

        $record = \App\Modules\Remis\Models\ScreeningChecklist::create([
            'remis_application_id' => $application->id,
            'proposal_attached' => $checklist['proposal_attached'] ?? false,
            'consent_form_attached' => $checklist['consent_form_attached'] ?? false,
            'instrument_attached' => $checklist['instrument_attached'] ?? false,
            'signatures_complete' => $checklist['signatures_complete'] ?? false,
            'required_templates_used' => $checklist['required_templates_used'] ?? false,
            'decision' => $decision,
            'comments' => $comments,
            'screened_by' => $screenedBy ?? $application->applicant_id,
            'screened_at' => now(),
        ]);

        $this->auditLog->record('remis_application.screened', $application, null, [
            'decision' => $decision, 'screening_checklist_id' => $record->id,
        ]);

        return match ($decision) {
            'complete' => (function () use ($application) {
                $application = $this->transition($application, 'for_review', 'remis_application.screening_complete');

                // docs/3.3: Routed to Ethics Reviewer(s) -> Ethics Reviewer(s). No specific
                // reviewer is assigned yet (that's assignReviewer(), a separate step owned by the
                // Chair) — this is a heads-up to the role that a study has entered the queue.
                $this->notifications->notifyRole('ethics_reviewer', 'REMIS application ready for review', "REMIS application {$application->tracking_number} passed screening and is ready for review assignment.", $application);

                return $application;
            })(),
            'incomplete', 'returned_for_compliance' => (function () use ($application, $comments, $record) {
                $application->update(['returned_from_status' => 'for_screening']);

                $application = $this->transition($application, 'for_revision', 'remis_application.screening_deficient', $comments);

                // FRS §VI: auto-generate a deficiency notice on a deficient outcome.
                \App\Modules\Remis\Jobs\GenerateDeficiencyNoticeJob::dispatch($record->id);

                // docs/3.3: For Revision (from any stage) -> Researcher.
                $this->notifications->notifyUser($application->applicant, 'REMIS application returned for revision', "REMIS application {$application->tracking_number} was returned during screening — a deficiency notice has been issued.", $application);

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

    /**
     * @param  array<string, array{verdict: string, comment?: ?string}>  $criteria  FRS §VIII —
     *         the reviewer's verdict on each of the seven named criteria (keyed by criterion).
     */
    public function classifyRiskAndRecommend(
        ReviewAssignment $assignment,
        string $riskLevel,
        string $rationale,
        string $recommendation,
        string $comments,
        array $criteria = [],
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

        // FRS §VIII — record the per-criterion assessment. Replace any prior set for idempotency.
        $assignment->criteriaAssessments()->delete();
        foreach (\App\Modules\Remis\Models\ReviewCriterionAssessment::CRITERIA as $key => $label) {
            if (! isset($criteria[$key])) {
                continue;
            }
            $assignment->criteriaAssessments()->create([
                'criterion' => $key,
                'verdict' => $criteria[$key]['verdict'],
                'comment' => $criteria[$key]['comment'] ?? null,
            ]);
        }

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

        $decisionIdentity = SignatureIdentity::capture();

        Decision::create([
            'remis_application_id' => $application->id,
            'outcome' => $outcome,
            'decided_by' => $chairId,
            'decision_date' => now()->toDateString(),
            'conditions' => $conditions,
            'remarks' => $remarks,
            'signature_id' => $signature,
            'signature_image' => $signatureImage,
            'signature_ip' => $decisionIdentity['ip'],
            'signature_user_agent' => $decisionIdentity['user_agent'],
        ]);

        // for_revision: set returned_from_status so resubmit goes back to for_review, not endorsement.
        if ($outcome === 'for_revision') {
            $application->update(['returned_from_status' => 'for_review']);
        }

        $application = $this->transition($application, $outcome, "remis_application.decision_{$outcome}", $remarks);

        // docs/3.3: Decision issued (any of the four outcomes) -> Researcher.
        $this->notifications->notifyUser($application->applicant, 'REMIS decision issued', "REMIS application {$application->tracking_number} decision: {$outcome}.", $application);

        if (in_array($outcome, ['approved', 'approved_with_conditions', 'exempted'], true)) {
            // An "exempted" decision issues the Certificate of Exemption; the others issue the
            // Research Ethics Clearance (stakeholder 2026-07-28).
            $this->clearance->signEthicsTrack($application->researchApplication, $chairId, exempted: $outcome === 'exempted');
        }

        return $application->fresh();
    }

    /**
     * Notify the ONE adviser who owns this application, when known.
     *
     * `adviser_id` is set at submission from the applicant's class cohort
     * (ResearchApplicationService::submitForm1). Before that existed this was a `notifyRole('adviser')`
     * broadcast, which meant every adviser in the institution got an in-app notification and a queued
     * email for every submission. The broadcast is kept only as the fallback for applicants who
     * belong to no cohort — otherwise nobody would be told at all.
     */
    private function notifyAdviser(RemisApplication $application, string $subject, string $body): void
    {
        if ($application->adviser) {
            $this->notifications->notifyUser($application->adviser, $subject, $body, $application);

            return;
        }

        $this->notifications->notifyRole('adviser', $subject, $body, $application);
    }

    // docs/3.3: deferred is not a terminal state — the Chair can reactivate for re-review.
    public function reactivateFromDeferred(RemisApplication $application): RemisApplication
    {
        $application = $this->transition($application, 'for_review', 'remis_application.reactivated');

        $this->notifications->notifyRole('ethics_committee_chair', 'REMIS application reactivated', "REMIS application {$application->tracking_number} has been reactivated for review.", $application);

        // Notify assigned reviewers that the study is back for review.
        foreach ($application->reviewAssignments as $assignment) {
            $this->notifications->notifyUser($assignment->reviewer, 'REMIS application reactivated', "REMIS application {$application->tracking_number} has been reactivated for review.", $application);
        }

        return $application;
    }

    private function transition(RemisApplication $application, string $toStatus, string $eventType, ?string $comments = null): RemisApplication
    {
        return DB::transaction(function () use ($application, $toStatus, $eventType, $comments) {
            $locked = RemisApplication::lockForUpdate()->findOrFail($application->id);

            if (! $locked->canTransitionTo($toStatus)) {
                throw new RuntimeException("Illegal REMIS transition: {$locked->status} -> {$toStatus}.");
            }

            $fromStatus = $locked->status;
            $locked->update(['status' => $toStatus]);

            $this->statusHistory->record($locked, $fromStatus, $toStatus, $comments);
            $this->auditLog->record($eventType, $locked, ['status' => $fromStatus], ['status' => $toStatus]);

            return $locked->fresh();
        });
    }

    /**
     * Resume monitoring after an incident has been resolved.
     * Only allowed from 'monitoring_paused' status.
     */
    public function resumeMonitoring(RemisApplication $application, int $actorId): RemisApplication
    {
        $application = $this->transition($application, 'monitoring', 'remis_application.monitoring_resumed');

        $this->notifications->notifyUser($application->applicant, 'REMIS monitoring resumed', "Monitoring for your REMIS study {$application->tracking_number} has resumed after corrective actions were completed.", $application);

        return $application->fresh();
    }
}
