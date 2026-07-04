<?php

namespace App\Shared\AuditLog\Services;

use App\Shared\AuditLog\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

// docs/4.4-audit-trail-status-tracking.md — every state-changing action across all modules
// must write exactly one audit_log row. Modules call this service rather than writing to
// audit_log directly, so ip_address/device_info capture is never forgotten (docs/testing-strategy.md
// flags a missing audit row as a security gap, not just a coverage gap).
class AuditLogService
{
    public function record(
        string $eventType,
        ?Model $auditable = null,
        ?array $oldValue = null,
        ?array $newValue = null,
    ): AuditLog {
        return AuditLog::create([
            'user_id' => Auth::id(),
            'event_type' => $eventType,
            'auditable_type' => $auditable?->getMorphClass(),
            'auditable_id' => $auditable?->getKey(),
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'ip_address' => Request::ip(),
            'device_info' => Request::userAgent(),
        ]);
    }
}
