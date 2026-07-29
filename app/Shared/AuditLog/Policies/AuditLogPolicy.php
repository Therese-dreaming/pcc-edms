<?php

namespace App\Shared\AuditLog\Policies;

use App\Models\User;

// docs/4.4-audit-trail-status-tracking.md — read access restricted to Admin, DPO Staff, and
// Ethics Committee Chair only (confirmed 2026-07-06). This is narrower than the rest of the
// "own office" visibility rows in 0.2's capability matrix — audit trail access is explicitly
// restricted, not just "any office staff."
class AuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['system_administrator', 'dpo_staff', 'ethics_committee_chair']);
    }
}