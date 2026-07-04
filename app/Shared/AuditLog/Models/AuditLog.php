<?php

namespace App\Shared\AuditLog\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

// docs/system-design.md §3.1 `audit_log` — append-only (docs/4.4, FRS §XVI). This model refuses
// update/delete at the application layer so "audit_log rows are provably immutable" (see
// docs/testing-strategy.md) is enforced everywhere the model is used, not just by convention.
class AuditLog extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    protected $table = 'audit_log';

    protected $fillable = [
        'user_id',
        'event_type',
        'auditable_type',
        'auditable_id',
        'old_value',
        'new_value',
        'ip_address',
        'device_info',
    ];

    protected function casts(): array
    {
        return [
            'old_value' => 'array',
            'new_value' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function () {
            throw new LogicException('audit_log rows are append-only and cannot be updated.');
        });

        static::deleting(function () {
            throw new LogicException('audit_log rows are append-only and cannot be deleted.');
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
