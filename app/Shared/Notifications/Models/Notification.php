<?php

namespace App\Shared\Notifications\Models;

use App\Models\User;
use App\Modules\Dpnda\Models\DpndaRecord;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Remis\Incident\Models\Incident;
use App\Modules\Remis\Models\RemisApplication;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Route;
use Throwable;

// docs/system-design.md §3.1 `notifications` — backs docs/4.3's in-app/email/SMS dashboards.
// Distinct from Laravel's built-in notifications facade table (not used in this system).
class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'channel',
        'subject',
        'body',
        'related_type',
        'related_id',
        'read_at',
    ];

    protected $appends = ['related_url'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function related(): MorphTo
    {
        return $this->morphTo();
    }

    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    // No morph map is registered (system-design.md's `related_type` stores the raw FQCN), so
    // this maps that FQCN to the one show page each related type actually has — not every
    // notifiable type does (e.g. ClearanceCertificate/ProgressReport have no standalone page,
    // so callers pass the nearest linkable parent instead, see ClearanceService/
    // RemisMonitoringService). Unmapped or missing related records resolve to null, not an
    // exception — the bell should never break just because a link target changed.
    public function getRelatedUrlAttribute(): ?string
    {
        if (! $this->related_type || ! $this->related_id) {
            return null;
        }

        $routeName = match ($this->related_type) {
            DpreqApplication::class => 'dpreq.show',
            DpndaRecord::class => 'dpnda.show',
            RemisApplication::class => 'remis.show',
            Incident::class => 'incidents.show',
            default => null,
        };

        if ($routeName === null || ! Route::has($routeName)) {
            return null;
        }

        try {
            // Relative, not absolute: APP_URL doesn't necessarily include the port the app is
            // actually being served on in every environment, and the frontend only ever uses
            // this for an in-app Inertia visit, which works fine with a path alone.
            return route($routeName, $this->related_id, false);
        } catch (Throwable) {
            return null;
        }
    }
}
