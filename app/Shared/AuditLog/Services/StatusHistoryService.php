<?php

namespace App\Shared\AuditLog\Services;

use App\Shared\AuditLog\Models\StatusHistory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

// docs/system-design.md §3.1 `status_history` — drives every workflow diagram in docs/1.2,
// docs/2.2, docs/3.3. Every workflow service (e.g. DpreqWorkflowService) calls this instead of
// writing status_history rows directly, so from_status/to_status/changed_by are always captured
// consistently.
class StatusHistoryService
{
    public function record(Model $statusable, ?string $fromStatus, string $toStatus, ?string $comments = null): StatusHistory
    {
        return StatusHistory::create([
            'statusable_type' => $statusable->getMorphClass(),
            'statusable_id' => $statusable->getKey(),
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'changed_by' => Auth::id(),
            'comments' => $comments,
        ]);
    }
}
