<?php

namespace App\Modules\Remis\Monitoring\Policies;

use App\Models\User;
use App\Modules\Remis\Monitoring\Models\ProgressReport;

// docs/3.4-remis-monitoring-archiving.md FRS §XII — "Ethics Reviewer logs monitoring
// notes/compliance status." Scoped to the reviewer actually assigned to this study, matching
// RemisApplicationPolicy::reviewAsAssignedReviewer()'s pattern rather than any ethics_reviewer.
class ProgressReportPolicy
{
    public function view(User $user, ProgressReport $report): bool
    {
        return $report->submitted_by === $user->id
            || $report->remisApplication->reviewAssignments->contains('reviewer_id', $user->id)
            || $user->hasAnyRole(['ethics_secretariat', 'ethics_committee_chair', 'system_administrator']);
    }

    public function review(User $user, ProgressReport $report): bool
    {
        return $report->remisApplication->reviewAssignments->contains('reviewer_id', $user->id);
    }
}
