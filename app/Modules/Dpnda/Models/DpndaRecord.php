<?php

namespace App\Modules\Dpnda\Models;

use App\Shared\AuditLog\Models\StatusHistory;
use App\Shared\Documents\Models\Document;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

// docs/2.2-dpnda-workflow.md — OJT/Trainee NDA (Form 5) status lifecycle.
class DpndaRecord extends Model
{
    use HasFactory;

    public const LEGAL_TRANSITIONS = [
        'draft' => ['sent_for_signing'],
        'sent_for_signing' => ['trainee_signed', 'declined'],
        'trainee_signed' => ['coordinator_countersigned'],
        'declined' => [],
        'coordinator_countersigned' => ['completed'],
        'completed' => [],
    ];

    protected $fillable = [
        'placement_id',
        'tracking_number',
        'status',
        'guardian_name',
        'trainee_signature_id',
        'trainee_signature_image',
        'trainee_signed_at',
        'coordinator_signature_id',
        'coordinator_signature_image',
        'coordinator_signed_at',
        'decline_reason',
    ];

    protected function casts(): array
    {
        return [
            'trainee_signed_at' => 'datetime',
            'coordinator_signed_at' => 'datetime',
        ];
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
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
}
