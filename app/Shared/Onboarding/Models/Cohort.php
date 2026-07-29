<?php

namespace App\Shared\Onboarding\Models;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// A class/section an adviser onboards in one go via a shareable join code. See the migration for
// why this exists and App\Shared\Onboarding\Services\CohortService for the guard rules.
class Cohort extends Model
{
    use HasFactory;

    protected $fillable = [
        'adviser_id',
        'name',
        'department',
        'level',
        'course',
        'section',
        'role_id',
        'join_code',
        'expires_at',
        'max_members',
        'allowed_email_domains',
        'is_open',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'allowed_email_domains' => 'array',
            'is_open' => 'boolean',
        ];
    }

    public function adviser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adviser_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(CohortMember::class)->orderBy('full_name');
    }

    /** Members that count against `max_members`: joined, plus invitations still outstanding. */
    public function activeMembers(): HasMany
    {
        return $this->hasMany(CohortMember::class)->whereIn('status', ['invited', 'pending', 'joined']);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && now()->greaterThan($this->expires_at);
    }

    public function isFull(): bool
    {
        return $this->max_members !== null && $this->activeMembers()->count() >= $this->max_members;
    }

    /**
     * Why a joiner can't be accepted right now, or null when they can. The string doubles as the
     * state the public join page renders, so the reason is never ambiguous to the student.
     *
     * @return 'closed'|'expired'|'full'|null
     */
    public function rejectionReason(): ?string
    {
        return match (true) {
            ! $this->is_open => 'closed',
            $this->isExpired() => 'expired',
            $this->isFull() => 'full',
            default => null,
        };
    }

    public function canAccept(): bool
    {
        return $this->rejectionReason() === null;
    }

    /**
     * Domain restriction (confirmed guard, 2026-07-25). An empty/null list means any domain, since
     * external researchers legitimately use non-institutional addresses.
     */
    public function emailAllowed(string $email): bool
    {
        $domains = array_filter(array_map('strtolower', $this->allowed_email_domains ?? []));

        if ($domains === []) {
            return true;
        }

        $emailDomain = strtolower((string) substr(strrchr($email, '@') ?: '', 1));

        return $emailDomain !== '' && in_array($emailDomain, $domains, true);
    }

    public function joinUrl(): string
    {
        return route('join.cohort', $this->join_code);
    }
}
