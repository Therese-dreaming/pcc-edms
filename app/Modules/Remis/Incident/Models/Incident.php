<?php

namespace App\Modules\Remis\Incident\Models;

use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\AuditLog\Models\StatusHistory;
use App\Shared\Documents\Models\Document;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

// docs/3.5-remis-incident-reporting.md — independent of RemisApplication::LEGAL_TRANSITIONS;
// an incident can be filed and tracked at any point during monitoring without pausing the study.
class Incident extends Model
{
    use HasFactory;
    // Register bulk actions: archived_at removes from the active register; soft-delete hides
    // (recoverable).
    use SoftDeletes;

    public const NOTIFY_DPO_TYPES = ['data_breach', 'confidentiality_breach'];

    public const LEGAL_TRANSITIONS = [
        'reported' => ['under_investigation'],
        'under_investigation' => ['corrective_action_in_progress', 'resolved'],
        'corrective_action_in_progress' => ['resolved'],
        'resolved' => ['closed'],
        'closed' => [],
    ];

    protected $fillable = [
        'remis_application_id',
        'incident_type',
        'severity',
        'incident_date',
        'reported_by',
        'description',
        'immediate_actions',
        'status',
        'assigned_to',
        'investigation_notes',
        'corrective_action_required',
        'corrective_action_due_date',
        'corrective_action_status',
        'verified_by',
        'verified_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'incident_date' => 'date',
            'corrective_action_due_date' => 'date',
            'verified_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function remisApplication(): BelongsTo
    {
        return $this->belongsTo(RemisApplication::class);
    }

    // Named reporter()/assignee()/verifier() rather than reportedBy()/assignedTo()/verifiedBy()
    // on purpose: those snake_case to the exact same JSON keys as the reported_by/assigned_to/
    // verified_by FK columns, and Eloquent's toArray() merges relations over attributes — the
    // raw ID would silently disappear behind the loaded User object.
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function statusHistory(): MorphMany
    {
        // Secondary `id` tiebreaker — see Dpreq\Models\DpreqApplication::statusHistory().
        return $this->morphMany(StatusHistory::class, 'statusable')->latest('created_at')->latest('id');
    }

    public function canTransitionTo(string $toStatus): bool
    {
        return in_array($toStatus, self::LEGAL_TRANSITIONS[$this->status] ?? [], true);
    }

    public function notifiesDpo(): bool
    {
        return in_array($this->incident_type, self::NOTIFY_DPO_TYPES, true);
    }
}
