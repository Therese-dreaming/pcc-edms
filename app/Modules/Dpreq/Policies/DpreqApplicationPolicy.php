<?php

namespace App\Modules\Dpreq\Policies;

use App\Models\User;
use App\Modules\Dpreq\Models\DpreqApplication;

// docs/0.2-stakeholders-and-roles.md capability matrix, DPREQ rows. docs/4.1: unauthorized
// actions must return a clear access-denied response and be logged as an audit event — Laravel
// authorizes via this policy and the controller logs denials (docs/testing-strategy.md).
class DpreqApplicationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isActive();
    }

    public function view(User $user, DpreqApplication $application): bool
    {
        return $application->applicant_id === $user->id
            || $user->hasAnyRole(['dpo_staff', 'dpo_approver', 'system_administrator']);
    }

    public function create(User $user): bool
    {
        // docs/0.2: any "Requester" role may submit; DPO staff/approver act on applications,
        // they don't submit their own.
        return $user->isActive() && ! $user->hasAnyRole(['dpo_staff', 'dpo_approver']);
    }

    public function screen(User $user, DpreqApplication $application): bool
    {
        return $user->hasRole('dpo_staff');
    }

    public function returnForCorrection(User $user, DpreqApplication $application): bool
    {
        return $user->hasRole('dpo_staff');
    }

    public function resubmit(User $user, DpreqApplication $application): bool
    {
        return $application->applicant_id === $user->id;
    }

    public function endorse(User $user, DpreqApplication $application): bool
    {
        return $user->hasRole('dpo_staff');
    }

    public function approve(User $user, DpreqApplication $application): bool
    {
        return $user->hasRole('dpo_approver');
    }

    public function reject(User $user, DpreqApplication $application): bool
    {
        return $user->hasAnyRole(['dpo_staff', 'dpo_approver']);
    }
}
