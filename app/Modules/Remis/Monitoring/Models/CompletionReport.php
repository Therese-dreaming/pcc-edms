<?php

namespace App\Modules\Remis\Monitoring\Models;

use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Documents\Models\Document;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

// docs/3.4-remis-monitoring-archiving.md FRS §XIV — Final Ethics Completion Report, 1:1 with a
// remis_applications row. See the migration for why `archived_at` lives here.
class CompletionReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'remis_application_id',
        'completion_date',
        'final_participant_count',
        'compliance_statement',
        'publication_status',
        'data_storage_location',
        'final_outcome',
        'submitted_by',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'completion_date' => 'date',
            'archived_at' => 'datetime',
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

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
