<?php

namespace App\Modules\Dpnda\Policies;

use App\Models\User;
use App\Modules\Dpnda\Models\Placement;

// docs/0.2-stakeholders-and-roles.md capability matrix: "Upload OJT evaluation report | Dept
// Coordinator". Authorized against Placement (not OjtEvaluationReport) because there's no
// OjtEvaluationReport row yet at the point of upload — same reasoning as
// RemisApplicationPolicy::submitProgressReport() checking against RemisApplication.
class PlacementPolicy
{
    public function uploadEvaluationReport(User $user, Placement $placement): bool
    {
        return $placement->coordinator_id === $user->id;
    }
}
