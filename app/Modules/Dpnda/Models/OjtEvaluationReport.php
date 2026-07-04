<?php

namespace App\Modules\Dpnda\Models;

use App\Models\User;
use App\Shared\Documents\Models\Document;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

// docs/5.3-reports-dpo.md "Gap flagged" / docs/2.1 — one evaluation report per placement,
// uploaded by the Dept Coordinator at placement end. The actual file goes through the shared
// `documents` polymorphic table like every other upload in this system, not a column here.
class OjtEvaluationReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'placement_id',
        'uploaded_by',
        'submitted_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
