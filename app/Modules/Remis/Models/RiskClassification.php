<?php

namespace App\Modules\Remis\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// docs/3.2-remis-screening-risk.md FRS §VII.
class RiskClassification extends Model
{
    use HasFactory;

    public const LEVEL_TO_REVIEW_TYPE = [
        'minimal' => 'expedited',
        'moderate' => 'committee',
        'high' => 'full_board',
    ];

    protected $fillable = [
        'remis_application_id',
        'level',
        'review_type',
        'classified_by',
        'classification_date',
        'rationale',
    ];

    protected function casts(): array
    {
        return [
            'classification_date' => 'date',
        ];
    }

    public function remisApplication(): BelongsTo
    {
        return $this->belongsTo(RemisApplication::class);
    }

    public function classifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'classified_by');
    }
}
