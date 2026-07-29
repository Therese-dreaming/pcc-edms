<?php

namespace App\Shared\Onboarding\Policies;

use App\Models\User;
use App\Shared\Onboarding\Models\Cohort;

// Advisers own their research classes; department coordinators own OJT batches; system_administrator
// can see and manage any. The sole gate on cohort-based account creation since the standalone
// applicant form was retired (2026-07-25).
class CohortPolicy
{
    // Roles that may own cohorts.
    public const OWNER_ROLES = ['adviser', 'department_coordinator', 'system_administrator'];

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(self::OWNER_ROLES);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(self::OWNER_ROLES);
    }

    public function view(User $user, Cohort $cohort): bool
    {
        return $this->owns($user, $cohort);
    }

    public function update(User $user, Cohort $cohort): bool
    {
        return $this->owns($user, $cohort);
    }

    private function owns(User $user, Cohort $cohort): bool
    {
        return $user->hasRole('system_administrator') || $cohort->adviser_id === $user->id;
    }
}
