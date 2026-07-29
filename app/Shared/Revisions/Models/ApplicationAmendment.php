<?php

namespace App\Shared\Revisions\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

// A single tracked edit to a submitted application field (old -> new + reason). Recorded so the
// original submission is never silently overwritten (confirmed edit policy, 2026-07-25).
class ApplicationAmendment extends Model
{
    use HasFactory;

    protected $fillable = [
        'amendable_type',
        'amendable_id',
        'field',
        'old_value',
        'new_value',
        'reason',
        'amended_by',
    ];

    public function amendable(): MorphTo
    {
        return $this->morphTo();
    }

    public function amendedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'amended_by');
    }
}
