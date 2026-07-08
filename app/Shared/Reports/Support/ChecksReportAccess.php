<?php

namespace App\Shared\Reports\Support;

use App\Models\User;
use Symfony\Component\HttpKernel\Exception\HttpException;

// docs/0.2-stakeholders-and-roles.md capability matrix, "Generate reports" row — the roles
// listed there, split into who can see DPO-specific vs ORD-specific vs shared report content.
trait ChecksReportAccess
{
    /** @var list<string> */
    protected array $dpoReportRoles = ['dpo_staff', 'system_administrator'];

    /** @var list<string> */
    protected array $ordReportRoles = ['ethics_secretariat', 'ethics_committee_chair', 'system_administrator'];

    /** @var list<string> */
    protected array $sharedReportRoles = [
        'dpo_staff', 'ethics_secretariat', 'ethics_committee_chair', 'system_administrator',
    ];

    /**
     * @param  list<string>  $roles
     */
    protected function authorizeReportAccess(User $user, array $roles): void
    {
        if (! $user->hasAnyRole($roles)) {
            throw new HttpException(403, 'You do not have access to this report.');
        }
    }
}
