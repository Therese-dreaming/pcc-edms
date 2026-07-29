<?php

namespace App\Modules\Dpreq\Models;

use App\Models\User;
use App\Shared\AuditLog\Models\StatusHistory;
use App\Shared\Concurrency\Concerns\OptimisticLocking;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

// docs/1.2-dpreq-workflow.md — status lifecycle for the DPO track. Legal transitions are the
// single source of truth for App\Modules\Dpreq\Services\DpreqWorkflowService, which rejects any
// move not listed here (docs/testing-strategy.md: "every illegal transition is rejected with a
// clear error, not silently allowed").
class DpreqApplication extends Model
{
    use HasFactory;
    // Register bulk actions: soft-delete hides a record (recoverable), archived_at removes it from
    // the active register while keeping it intact.
    use SoftDeletes;

    // Optimistic locking on the `version` column — rejects a save that would overwrite another
    // reviewer's concurrent change (App\Shared\Concurrency\Concerns\OptimisticLocking).
    use OptimisticLocking;

    /**
     * docs/1.2-dpreq-workflow.md status diagram, as an adjacency list.
     *
     * @var array<string, list<string>>
     */
    // Collapsed to Review -> Approve (2026-07-25): the single dpo_staff role takes an application
    // under review, then approves / returns / rejects. The old four-step
    // screening -> under_review -> endorsed -> approved chain (all one person) was redundant.
    public const LEGAL_TRANSITIONS = [
        'draft' => ['submitted'],
        'submitted' => ['under_review'],
        'under_review' => ['approved', 'returned', 'rejected'],
        'returned' => ['submitted'],
        'approved' => ['clearance_issued'],
        'rejected' => [],
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
        'approved_by',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'data_types' => 'array',
            'data_subjects' => 'array',
            'third_party_sharing' => 'boolean',
            'archived_at' => 'datetime',
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

    public function revisionRequests(): MorphMany
    {
        return $this->morphMany(\App\Shared\Revisions\Models\RevisionRequest::class, 'requestable')->latest();
    }

    public function amendments(): MorphMany
    {
        return $this->morphMany(\App\Shared\Revisions\Models\ApplicationAmendment::class, 'amendable')->latest();
    }

    public function canTransitionTo(string $toStatus): bool
    {
        return in_array($toStatus, self::LEGAL_TRANSITIONS[$this->status] ?? [], true);
    }
}
