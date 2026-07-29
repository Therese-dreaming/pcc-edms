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
            || $user->hasAnyRole(['dpo_staff', 'system_administrator']);
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

    // Register housekeeping (index bulk Actions). DPO staff/admin curate the register; the owning
    // coordinator may act only on their own still-draft record.
    public function archive(User $user, DpndaRecord $record): bool
    {
        return $user->hasAnyRole(['dpo_staff', 'system_administrator'])
            || ($record->placement->coordinator_id === $user->id && $record->status === 'draft');
    }

    public function delete(User $user, DpndaRecord $record): bool
    {
        return $user->hasRole('system_administrator')
            || ($record->placement->coordinator_id === $user->id && $record->status === 'draft');
    }
}
