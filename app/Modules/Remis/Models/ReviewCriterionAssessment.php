<?php

namespace App\Modules\Remis\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// FRS §VIII — one reviewer's verdict on one of the seven ethics review criteria.
class ReviewCriterionAssessment extends Model
{
    use HasFactory;

    // Eloquent would guess `review_criterion_assessments`; the table is `review_criteria_assessments`.
    protected $table = 'review_criteria_assessments';

    // The seven FRS §VIII criteria, in display order (key => label).
    public const CRITERIA = [
        'voluntary_participation' => 'Voluntary Participation',
        'informed_consent' => 'Informed Consent',
        'protection_from_harm' => 'Protection from Harm',
        'confidentiality' => 'Confidentiality',
        'participant_selection' => 'Participant Selection',
        'privacy_protection' => 'Privacy Protection',
        'ethical_acceptability' => 'Ethical Acceptability',
    ];

    protected $fillable = [
        'review_assignment_id',
        'criterion',
        'verdict',
        'comment',
    ];

    public function reviewAssignment(): BelongsTo
    {
        return $this->belongsTo(ReviewAssignment::class);
    }
}
