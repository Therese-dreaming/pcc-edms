<?php

namespace App\Modules\Dpreq\Models;

use App\Models\User;
use App\Shared\AuditLog\Models\StatusHistory;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

// docs/1.2-dpreq-workflow.md — status lifecycle for the DPO track. Legal transitions are the
// single source of truth for App\Modules\Dpreq\Services\DpreqWorkflowService, which rejects any
// move not listed here (docs/testing-strategy.md: "every illegal transition is rejected with a
// clear error, not silently allowed").
class DpreqApplication extends Model
{
    use HasFactory;

    /**
     * docs/1.2-dpreq-workflow.md status diagram, as an adjacency list.
     *
     * @var array<string, list<string>>
     */
    public const LEGAL_TRANSITIONS = [
        'draft' => ['submitted'],
        'submitted' => ['screening'],
        'screening' => ['returned', 'under_review'],
        'returned' => ['submitted'],
        'under_review' => ['endorsed', 'rejected'],
        'endorsed' => ['approved', 'rejected'],
        'rejected' => [],
        'approved' => ['clearance_issued'],
        'clearance_issued' => [],
    ];

    protected $fillable = [
        'research_application_id',
        'tracking_number',
        'applicant_id',
        'applicant_type',
        'department',
        'purpose',
        'data_types',
        'data_subjects',
        'retention_plan',
        'third_party_sharing',
        'third_party_detail',
        'status',
        'current_reviewer_id',
    ];

    protected function casts(): array
    {
        return [
            'data_types' => 'array',
            'data_subjects' => 'array',
            'third_party_sharing' => 'boolean',
        ];
    }

    public function researchApplication(): BelongsTo
    {
        return $this->belongsTo(ResearchApplication::class);
    }

    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function currentReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_reviewer_id');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function statusHistory(): MorphMany
    {
        // Secondary `id` tiebreaker: same-second transitions (common right after a batch
        // submission) would otherwise sort non-deterministically on `created_at` alone, and
        // reports that read statusHistory()->first() as "the latest transition" need a stable
        // answer.
        return $this->morphMany(StatusHistory::class, 'statusable')->latest('created_at')->latest('id');
    }

    public function canTransitionTo(string $toStatus): bool
    {
        return in_array($toStatus, self::LEGAL_TRANSITIONS[$this->status] ?? [], true);
    }
}
