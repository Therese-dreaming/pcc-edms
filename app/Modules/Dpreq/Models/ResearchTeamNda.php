<?php

namespace App\Modules\Dpreq\Models;

use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

// docs/2.1-dpnda-nda-template.md §2.1.a (Form 2, DPO-POL-005). Must reach `completed` (every
// signatory signed) before the DPO track (docs/1.2) can reach Approved.
class ResearchTeamNda extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_application_id',
        'tracking_number',
        'status',
    ];

    public function researchApplication(): BelongsTo
    {
        return $this->belongsTo(ResearchApplication::class);
    }

    public function signatories(): HasMany
    {
        return $this->hasMany(ResearchTeamNdaSignatory::class);
    }

    public function isFullySigned(): bool
    {
        return $this->signatories()->whereNull('signed_at')->doesntExist();
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
