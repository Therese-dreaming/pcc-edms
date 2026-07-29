<?php

namespace App\Shared\Revisions\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

// FRS §IX — one item a reviewer/DPO staff has asked the applicant to address (a comment or a
// required document). Polymorphic to either application track.
class RevisionRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'requestable_type',
        'requestable_id',
        'raised_by',
        'item',
        'kind',
        'is_mandatory',
        'due_date',
        'status',
        'resolved_by',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'is_mandatory' => 'boolean',
            'due_date' => 'date',
            'resolved_at' => 'datetime',
        ];
    }

    public function requestable(): MorphTo
    {
        return $this->morphTo();
    }

    public function raisedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'raised_by');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(RevisionResponse::class)->latest('responded_at');
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['open', 'responded'], true);
    }
}
