<?php

namespace App\Modules\Dpreq\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// docs/2.1-dpnda-nda-template.md §2.1.a — one row per research team member (Leader/Member).
// Co-members (added after submission) carry a unique, expiring, single-use signing token emailed
// to them (stakeholder-additional-features.md, 2026-07-25).
class ResearchTeamNdaSignatory extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_team_nda_id',
        'user_id',
        'full_name',
        'email',
        'role',
        'signature_id',
        'signature_image',
        'signature_ip',
        'signature_user_agent',
        'signed_at',
        'signing_token',
        'token_expires_at',
        'invited_at',
    ];

    protected $hidden = [
        // Never leak the raw signing token into serialized props — it's a bearer credential.
        'signing_token',
    ];

    protected function casts(): array
    {
        return [
            'signed_at' => 'datetime',
            'token_expires_at' => 'datetime',
            'invited_at' => 'datetime',
        ];
    }

    public function researchTeamNda(): BelongsTo
    {
        return $this->belongsTo(ResearchTeamNda::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hasSigned(): bool
    {
        return $this->signed_at !== null;
    }

    public function isTokenExpired(): bool
    {
        return $this->token_expires_at !== null && now()->greaterThan($this->token_expires_at);
    }

    // A signing link is usable only if it exists, hasn't been used (single-use = not yet signed),
    // and hasn't expired.
    public function isLinkUsable(): bool
    {
        return $this->signing_token !== null && ! $this->hasSigned() && ! $this->isTokenExpired();
    }
}
