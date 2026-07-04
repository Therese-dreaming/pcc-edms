<?php

namespace App\Modules\Remis\Monitoring\Models;

use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Documents\Models\Document;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

// docs/3.4-remis-monitoring-archiving.md FRS §XII — one row per periodic Research Progress
// Report. Named submitter()/reviewer() rather than submittedBy()/reviewedBy() to sidestep the
// same snake_case/FK collision documented on Incident::reporter() — see that class for why.
class ProgressReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'remis_application_id',
        'submitted_by',
        'status_of_study',
        'participants_recruited',
        'ethics_concerns',
        'protocol_deviations',
        'corrective_actions',
        'submitted_at',
        'compliance_status',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function remisApplication(): BelongsTo
    {
        return $this->belongsTo(RemisApplication::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
