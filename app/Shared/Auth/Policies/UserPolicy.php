<?php

namespace App\Shared\Auth\Policies;

use App\Models\User;

// docs/0.2-stakeholders-and-roles.md capability matrix, "Manage user accounts/rights" row —
// system_administrator is the only role with this capability, on both the DPO and ORD/REC side.
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('system_administrator');
    }

    public function view(User $user, User $subject): bool
    {
        return $user->hasRole('system_administrator');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('system_administrator');
    }

    public function update(User $user, User $subject): bool
    {
        return $user->hasRole('system_administrator');
    }
}
