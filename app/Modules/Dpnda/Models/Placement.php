<?php

namespace App\Modules\Dpnda\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

// docs/2.1-dpnda-nda-template.md §2.1.b (Form 5, reqs/DPO EFORM 5 SAMPLE.pdf) — first-class
// OJT/Trainee/Student-Teacher/Community-Service placement record, independent of research
// applications (docs/0.4: this track never touches Ethics/REMIS).
class Placement extends Model
{
    use HasFactory;

    protected $fillable = [
        'trainee_id',
        'trainee_last_name',
        'trainee_first_name',
        'trainee_middle_initial',
        'gender',
        'age',
        'enrolled_school',
        'hours_needed',
        'trainee_type',
        'department',
        'level',
        'course',
        'section',
        'address_house_no',
        'address_street',
        'address_barangay',
        'address_city',
        'department_assigned',
        'pcc_supervisor',
        'endorsed_by',
        'start_date',
        'end_date',
        'coordinator_id',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function trainee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainee_id');
    }

    public function coordinator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }

    public function dpndaRecord(): HasOne
    {
        return $this->hasOne(DpndaRecord::class);
    }

    public function ojtEvaluationReport(): HasOne
    {
        return $this->hasOne(OjtEvaluationReport::class);
    }

    public function traineeFullName(): string
    {
        return trim("{$this->trainee_first_name} {$this->trainee_middle_initial} {$this->trainee_last_name}");
    }
}
