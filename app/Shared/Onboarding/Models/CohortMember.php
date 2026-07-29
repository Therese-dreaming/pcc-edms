<?php

namespace App\Shared\Onboarding\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// One roster row per student, whether they self-enrolled via the join code or were added manually
// by the adviser and invited by email. Mirrors ResearchTeamNdaSignatory's token semantics.
class CohortMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'cohort_id',
        'user_id',
        'full_name',
        'email',
        'student_number',
        'status',
        'invitation_token',
        'token_expires_at',
        'invited_at',
        'joined_at',
    ];

    protected $hidden = [
        // Bearer credential — must never reach an Inertia prop.
        'invitation_token',
    ];

    protected function casts(): array
    {
        return [
            'token_expires_at' => 'datetime',
            'invited_at' => 'datetime',
            'joined_at' => 'datetime',
        ];
    }

    public function cohort(): BelongsTo
    {
        return $this->belongsTo(Cohort::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hasJoined(): bool
    {
        return $this->status === 'joined';
    }

    public function isTokenExpired(): bool
    {
        return $this->token_expires_at !== null && now()->greaterThan($this->token_expires_at);
    }

    /** Single-use (not yet joined) and unexpired — same rule as an NDA signing link. */
    public function isInvitationUsable(): bool
    {
        return $this->invitation_token !== null
            && $this->status === 'invited'
            && ! $this->isTokenExpired();
    }
}
