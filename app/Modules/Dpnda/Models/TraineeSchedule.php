<?php

namespace App\Modules\Dpnda\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// A single recurring weekly whereabouts block for a trainee's placement (day + time + location).
// Entered by the trainee themselves (self-service, no approval) and visualized on the DPNDA
// deployment calendar. See the create_trainee_schedules_table migration for the rationale.
class TraineeSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'placement_id',
        'day_of_week',
        'start_time',
        'end_time',
        'location',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
        ];
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
    }
}
