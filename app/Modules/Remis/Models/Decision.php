<?php

namespace App\Modules\Remis\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// docs/3.3-remis-review-workflow.md FRS §X — Ethics Committee Chair's final decision.
class Decision extends Model
{
    use HasFactory;

    public const POSITIVE_OUTCOMES = ['approved', 'approved_with_conditions'];

    protected $fillable = [
        'remis_application_id',
        'outcome',
        'decided_by',
        'decision_date',
        'conditions',
        'remarks',
        'signature_id',
        'signature_image',
    ];

    protected function casts(): array
    {
        return [
            'decision_date' => 'date',
        ];
    }

    public function remisApplication(): BelongsTo
    {
        return $this->belongsTo(RemisApplication::class);
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function isPositive(): bool
    {
        return in_array($this->outcome, self::POSITIVE_OUTCOMES, true);
    }
}
