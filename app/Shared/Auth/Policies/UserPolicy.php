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

    // DPO staff may also create accounts — specifically external adviser accounts on request
    // (stakeholder 2026-07-28). The admin Create-User screen assigns the role, so DPO staff can pick
    // the `adviser` role. Listing/editing existing users stays system_administrator-only above.
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['system_administrator', 'dpo_staff']);
    }

    public function update(User $user, User $subject): bool
    {
        return $user->hasRole('system_administrator');
    }

    // `createApplicant` lived here for the adviser's standalone one-applicant form, retired
    // 2026-07-25 when cohorts replaced it. Adviser-side account creation is now gated by
    // App\Shared\Onboarding\Policies\CohortPolicy instead.
}
