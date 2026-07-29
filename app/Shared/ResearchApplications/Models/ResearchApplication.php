<?php

namespace App\Shared\ResearchApplications\Models;

use App\Models\User;
use App\Shared\Clearance\Models\ClearanceCertificate;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

// docs/0.4-dpo-ethics-integration.md + docs/system-design.md §3.1 `research_applications` —
// the single Form 1 intake shared by the DPO track (Modules\Dpreq\Models\DpreqApplication) and
// the Ethics track (Modules\Remis\Models\RemisApplication), each holding a 1:1
// research_application_id FK back to this table. Those two relations are added when their
// respective modules are implemented (docs/9.0 step 5: DPREQ, then DPNDA, then REMIS).
class ResearchApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_id',
        'research_title',
        'research_category',
        'contact_number',
        'researcher_count',
        'co_researchers',
        'adviser_name',
        'applicant_category',
        'department',
        'level',
        'course',
        'section',
        'position',
        'respondents',
        'target_respondent_count',
        'data_collection_method',
        'data_capturing_tool',
        'target_start_date',
        'target_end_date',
        'minors_involved',
        'respondent_head_letter_approved',
        'review_checklist',
        'researcher_signature',
        'overall_status',
    ];

    protected function casts(): array
    {
        return [
            'target_start_date' => 'date',
            'target_end_date' => 'date',
            'minors_involved' => 'boolean',
            'respondent_head_letter_approved' => 'boolean',
            'co_researchers' => 'array',
            'review_checklist' => 'array',
        ];
    }

    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function clearanceCertificate(): HasOne
    {
        return $this->hasOne(ClearanceCertificate::class);
    }

    public function researchTeamNda(): HasOne
    {
        return $this->hasOne(\App\Modules\Dpreq\Models\ResearchTeamNda::class);
    }

    public function dpreqApplication(): HasOne
    {
        return $this->hasOne(\App\Modules\Dpreq\Models\DpreqApplication::class);
    }

    public function remisApplication(): HasOne
    {
        return $this->hasOne(\App\Modules\Remis\Models\RemisApplication::class);
    }
}
