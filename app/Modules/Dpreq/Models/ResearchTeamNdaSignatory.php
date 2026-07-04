<?php

namespace App\Modules\Dpreq\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// docs/2.1-dpnda-nda-template.md §2.1.a — one row per research team member (Leader/Member).
class ResearchTeamNdaSignatory extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_team_nda_id',
        'user_id',
        'full_name',
        'role',
        'signature_id',
        'signature_image',
        'signed_at',
    ];

    protected function casts(): array
    {
        return [
            'signed_at' => 'datetime',
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
}
