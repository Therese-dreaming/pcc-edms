<?php

namespace App\Modules\Remis\Models;

use App\Models\User;
use App\Modules\Remis\Monitoring\Models\CompletionReport;
use App\Modules\Remis\Monitoring\Models\ProgressReport;
use App\Shared\AuditLog\Models\StatusHistory;
use App\Shared\Concurrency\Concerns\OptimisticLocking;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

// docs/3.3-remis-review-workflow.md — the Ethics track, 1:1 with a research_applications row
// (docs/0.4). Status vocabulary matches FRS §V exactly.
class RemisApplication extends Model
{
    use HasFactory;
    // Register bulk actions: soft-delete hides a record (recoverable); archived_at removes it from
    // the active register (distinct from the `archived` workflow status).
    use SoftDeletes;

    // Optimistic locking on the `version` column — rejects a save that would overwrite another
    // reviewer's concurrent change (App\Shared\Concurrency\Concerns\OptimisticLocking).
    use OptimisticLocking;

    /**
     * docs/3.3 status diagram, as an adjacency list. `under_endorsement`'s three internal steps
     * (Adviser/Program Head/Dean) are tracked via `current_endorsement_step`, not separate
     * top-level statuses (FRS §IV describes them as one status with three actors).
     *
     * @var array<string, list<string>>
     */
    public const LEGAL_TRANSITIONS = [
        'draft_submitted' => ['under_endorsement'],
        'under_endorsement' => ['for_screening', 'for_revision', 'disapproved'],
        'for_revision' => ['under_endorsement', 'for_screening', 'for_review'],
        'for_screening' => ['for_review', 'for_revision'],
        'for_review' => ['approved', 'approved_with_conditions', 'exempted', 'deferred', 'disapproved', 'for_revision'],
        'approved' => ['clearance_issued'],
        'approved_with_conditions' => ['clearance_issued'],
        // Exemption issues the Certificate of Exemption and, like an approval, clears the track.
        'exempted' => ['clearance_issued'],
        'deferred' => ['for_review'],
        'disapproved' => [],
        // A breach incident can auto-hold a just-issued study before monitoring has begun
        // (docs/3.5) — hence monitoring_paused is reachable straight from clearance_issued, not
        // only from monitoring. Resume lands the study in monitoring either way.
        'clearance_issued' => ['monitoring', 'monitoring_paused'],
        'monitoring' => ['monitoring_paused', 'closed'],
        'monitoring_paused' => ['monitoring', 'closed'],
        'closed' => ['archived'],
        'archived' => [],
    ];

    // Fields the applicant may amend while the application is for_revision (confirmed edit policy,
    // 2026-07-25). Deliberately excludes status/ownership/tracking columns.
    public const AMENDABLE_FIELDS = [
        'study_type', 'study_design', 'target_population', 'participant_count',
        'inclusion_criteria', 'exclusion_criteria', 'vulnerable_population', 'study_sites',
        'funding_source', 'risks_to_participants', 'benefits', 'confidentiality_measures',
        'consent_process', 'data_storage_plan',
    ];

    protected $fillable = [
        'research_application_id',
        'tracking_number',
        'applicant_id',
        'adviser_id',
        'study_type',
        'study_design',
        'target_population',
        'participant_count',
        'inclusion_criteria',
        'exclusion_criteria',
        'vulnerable_population',
        'study_sites',
        'funding_source',
        'risks_to_participants',
        'benefits',
        'confidentiality_measures',
        'consent_process',
        'data_storage_plan',
        'status',
        'current_endorsement_step',
        'returned_from_status',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'vulnerable_population' => 'boolean',
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

    public function adviser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adviser_id');
    }

    public function endorsementActions(): HasMany
    {
        return $this->hasMany(EndorsementAction::class)->orderBy('acted_at');
    }

    public function incidents(): HasMany
    {
        return $this->hasMany(\App\Modules\Remis\Incident\Models\Incident::class)->latest();
    }

    public function riskClassification(): HasOne
    {
        return $this->hasOne(RiskClassification::class)->latestOfMany();
    }

    // docs/3.3 FRS §VIII/step 8 — a panel, not a single reviewer (docs/HANDOFF.md Part G).
    public function reviewAssignments(): HasMany
    {
        return $this->hasMany(ReviewAssignment::class)->orderBy('assigned_at');
    }

    public function decision(): HasOne
    {
        return $this->hasOne(Decision::class)->latestOfMany();
    }

    public function progressReports(): HasMany
    {
        return $this->hasMany(ProgressReport::class)->latest('submitted_at');
    }

    public function completionReport(): HasOne
    {
        return $this->hasOne(CompletionReport::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function statusHistory(): MorphMany
    {
        // Secondary `id` tiebreaker — see Dpreq\Models\DpreqApplication::statusHistory().
        return $this->morphMany(StatusHistory::class, 'statusable')->latest('created_at')->latest('id');
    }

    public function screeningChecklists(): HasMany
    {
        return $this->hasMany(ScreeningChecklist::class)->latest('screened_at');
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
