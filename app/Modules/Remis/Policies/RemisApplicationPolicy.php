<?php

namespace App\Modules\Remis\Policies;

use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;

// docs/0.2-stakeholders-and-roles.md capability matrix, REMIS rows (FRS §II — confirmed).
class RemisApplicationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isActive();
    }

    public function view(User $user, RemisApplication $application): bool
    {
        return $application->applicant_id === $user->id
            || $application->reviewAssignments->contains('reviewer_id', $user->id)
            || $user->hasAnyRole([
                'adviser', 'program_head', 'dean',
                'ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair',
                'system_administrator',
            ]);
    }

    // Downloading a submitted document. The intake uploads are shared research artifacts surfaced on
    // BOTH the DPREQ and REMIS sides, so any legitimate reviewer of either track — plus the owner —
    // may download them. Without this method Laravel denies `authorize('download', ...)` (403).
    public function download(User $user, RemisApplication $application): bool
    {
        return $application->applicant_id === $user->id
            || $application->reviewAssignments->contains('reviewer_id', $user->id)
            || $user->hasAnyRole([
                'dpo_staff', 'system_administrator',
                'adviser', 'program_head', 'dean',
                'ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair',
            ]);
    }

    public function endorse(User $user, RemisApplication $application): bool
    {
        return match ($application->current_endorsement_step) {
            // Adviser is a per-application assignment: only the designated adviser can endorse.
            // When adviser_id is null (legacy/edge case), fall back to role-only check.
            'adviser' => $user->hasRole('adviser')
                && ($application->adviser_id === null || $application->adviser_id === $user->id),
            // Program Head and Dean are institutional positions, not per-application — role-only.
            'program_head' => $user->hasRole('program_head'),
            'dean' => $user->hasRole('dean'),
            default => false,
        };
    }

    public function screen(User $user, RemisApplication $application): bool
    {
        return $user->hasRole('ethics_secretariat');
    }

    public function assignReviewer(User $user, RemisApplication $application): bool
    {
        return $user->hasRole('ethics_committee_chair');
    }

    // docs/3.3 FRS §VIII/step 8 — a panel of reviewers, each submitting their own recommendation
    // on their own `review_assignments` row (docs/HANDOFF.md Part G: multi-reviewer consolidation).
    public function reviewAsAssignedReviewer(User $user, RemisApplication $application): bool
    {
        return $application->reviewAssignments->contains('reviewer_id', $user->id);
    }

    public function decide(User $user, RemisApplication $application): bool
    {
        return $user->hasRole('ethics_committee_chair');
    }

    public function reactivate(User $user, RemisApplication $application): bool
    {
        return $user->hasRole('ethics_committee_chair');
    }

    // docs/3.4-remis-monitoring-archiving.md FRS §XII — only the study's own researcher files
    // progress reports.
    public function submitProgressReport(User $user, RemisApplication $application): bool
    {
        return $application->applicant_id === $user->id;
    }

    // docs/3.4 FRS §XIV — same actor as progress reports.
    public function submitCompletionReport(User $user, RemisApplication $application): bool
    {
        return $application->applicant_id === $user->id;
    }

    // docs/3.5-remis-incident-reporting.md "Who Can File" — lives here, not on IncidentPolicy,
    // because Laravel resolves the policy class from the *authorized object's* class
    // ($this->authorize('file', $remisApplication) looks up RemisApplication's policy), not
    // from which module conceptually owns the ability.
    public function file(User $user, RemisApplication $application): bool
    {
        return $application->applicant_id === $user->id
            || $user->hasAnyRole(['ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair']);
    }

    // Register housekeeping (index bulk Actions). Ethics staff/chair curate the register; an
    // applicant may act only on their own not-yet-submitted draft.
    public function archive(User $user, RemisApplication $application): bool
    {
        return $user->hasAnyRole(['ethics_secretariat', 'ethics_committee_chair', 'system_administrator'])
            || ($application->applicant_id === $user->id && $application->status === 'draft_submitted');
    }

    public function delete(User $user, RemisApplication $application): bool
    {
        return $user->hasRole('system_administrator')
            || ($application->applicant_id === $user->id && $application->status === 'draft_submitted');
    }
}
