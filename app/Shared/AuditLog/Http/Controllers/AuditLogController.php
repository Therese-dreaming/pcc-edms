<?php

namespace App\Shared\AuditLog\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\AuditLog\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// docs/4.4-audit-trail-status-tracking.md — filterable, exportable audit trail report.
// Access is gated by AuditLogPolicy (Admin / DPO Staff / Ethics Committee Chair only).
class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $this->authorize('viewAny', AuditLog::class);

        $query = AuditLog::query()
            ->with('user')
            ->latest('created_at');

        // docs/4.4: "Filterable by: date range, module, user, record ID, event type"
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        if ($request->filled('event_type')) {
            $query->where('event_type', $request->input('event_type'));
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }
        if ($request->filled('auditable_type')) {
            $query->where('auditable_type', $request->input('auditable_type'));
        }
        if ($request->filled('auditable_id')) {
            $query->where('auditable_id', $request->input('auditable_id'));
        }

        $auditLogs = $query->paginate(50)->withQueryString();

        // Distinct event types for the filter dropdown
        $eventTypes = AuditLog::select('event_type')->distinct()->pluck('event_type');

        return Inertia::render('AuditTrail/Index', [
            'auditLogs' => $auditLogs,
            'eventTypes' => $eventTypes,
            'filters' => $request->only(['date_from', 'date_to', 'event_type', 'user_id', 'auditable_type', 'auditable_id']),
        ]);
    }
}