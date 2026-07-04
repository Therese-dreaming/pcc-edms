<?php

namespace App\Modules\Remis\Incident\Policies;

use App\Models\User;
use App\Modules\Remis\Incident\Models\Incident;

// docs/3.5-remis-incident-reporting.md. Note: the "who can file" ability
// (docs/3.5's "Who Can File") lives on RemisApplicationPolicy::file(), not here — Laravel
// resolves policies by the authorized object's class, and filing is authorized against a
// RemisApplication (there's no Incident yet at that point). This policy only covers abilities
// checked against an existing Incident.
class IncidentPolicy
{
    public function view(User $user, Incident $incident): bool
    {
        return $incident->remisApplication->applicant_id === $user->id
            || $incident->reported_by === $user->id
            || $incident->assigned_to === $user->id
            || $user->hasAnyRole([
                'ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair',
                'dpo_staff', 'dpo_approver', 'system_administrator',
            ]);
    }

    public function manage(User $user, Incident $incident): bool
    {
        return $user->hasAnyRole(['ethics_secretariat', 'ethics_committee_chair'])
            || $incident->assigned_to === $user->id;
    }
}
