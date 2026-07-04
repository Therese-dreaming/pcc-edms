<?php

namespace App\Modules\Dpnda\Policies;

use App\Models\User;
use App\Modules\Dpnda\Models\DpndaRecord;

// docs/0.2-stakeholders-and-roles.md capability matrix, DPNDA rows.
class DpndaRecordPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isActive();
    }

    public function view(User $user, DpndaRecord $record): bool
    {
        return $record->placement->coordinator_id === $user->id
            || $record->placement->trainee_id === $user->id
            || $user->hasAnyRole(['dpo_staff', 'dpo_approver', 'system_administrator']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('department_coordinator');
    }

    public function sendForSigning(User $user, DpndaRecord $record): bool
    {
        return $record->placement->coordinator_id === $user->id;
    }

    public function sign(User $user, DpndaRecord $record): bool
    {
        return $record->placement->trainee_id === $user->id;
    }

    public function decline(User $user, DpndaRecord $record): bool
    {
        return $record->placement->trainee_id === $user->id;
    }

    public function countersign(User $user, DpndaRecord $record): bool
    {
        return $record->placement->coordinator_id === $user->id;
    }
}
