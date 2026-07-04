<?php

namespace App\Shared\AuditLog\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

// docs/system-design.md §3.1 `status_history` — polymorphic, drives every workflow diagram in
// docs/1.2, docs/2.2, docs/3.3. One row per transition, immutable once written.
class StatusHistory extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    protected $table = 'status_history';

    protected $fillable = [
        'statusable_type',
        'statusable_id',
        'from_status',
        'to_status',
        'changed_by',
        'comments',
    ];

    public function statusable(): MorphTo
    {
        return $this->morphTo();
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
