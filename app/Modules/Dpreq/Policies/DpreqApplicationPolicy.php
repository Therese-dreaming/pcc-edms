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
            || $user->hasAnyRole(['dpo_staff', 'system_administrator']);
    }

    // Downloading a submitted document. The intake uploads (research proposal, instruments,
    // approval/endorsement letters) are shared research artifacts surfaced on BOTH the DPREQ and
    // REMIS sides, so any legitimate reviewer of either track — plus the owner — may download them.
    // Without this method Laravel denies `authorize('download', ...)` outright (403).
    public function download(User $user, DpreqApplication $application): bool
    {
        return $application->applicant_id === $user->id
            || $user->hasAnyRole([
                'dpo_staff', 'system_administrator',
                'adviser', 'program_head', 'dean',
                'ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair',
            ]);
    }

    // Edit the Form-1 fields of the application. The applicant may correct their own submission while
    // it is still a draft or has been returned for correction (stakeholder 2026-07-28) — editing a
    // Form-1 field regenerates the Form 1 PDF as a new version.
    public function update(User $user, DpreqApplication $application): bool
    {
        return $application->applicant_id === $user->id
            && in_array($application->status, ['draft', 'returned'], true);
    }

    public function create(User $user): bool
    {
        // docs/0.2: any "Requester" role may submit; DPO staff act on applications, they don't
        // submit their own.
        return $user->isActive() && ! $user->hasRole('dpo_staff');
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

    public function approve(User $user, DpreqApplication $application): bool
    {
        // docs/0.2: DPO Approver was retired as a separate role — dpo_staff owns the full
        // track end to end, including final approval.
        return $user->hasRole('dpo_staff');
    }

    public function reject(User $user, DpreqApplication $application): bool
    {
        return $user->hasRole('dpo_staff');
    }

    // Register housekeeping (index bulk Actions). DPO staff curate the whole register; an applicant
    // may archive/delete only their own draft (nothing that has entered review).
    public function archive(User $user, DpreqApplication $application): bool
    {
        return $user->hasAnyRole(['dpo_staff', 'system_administrator'])
            || ($application->applicant_id === $user->id && $application->status === 'draft');
    }

    public function delete(User $user, DpreqApplication $application): bool
    {
        return $user->hasRole('system_administrator')
            || ($application->applicant_id === $user->id && $application->status === 'draft');
    }
}
