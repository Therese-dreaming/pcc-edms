<?php

namespace App\Modules\Dpnda\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Dpnda\Models\Placement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// DPNDA deployment calendar — a month view of where trainees are expected to be. Combines the
// coordinator-entered placement period (start/end) with the trainee-entered weekly schedule
// blocks (day of week + time + location). The frontend expands each placement's weekly pattern
// across the month grid; this controller just returns the scoped raw data for the requested month.
class DpndaCalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Month defaults to the current one; accept "YYYY-MM".
        $monthParam = trim((string) $request->string('month'));
        $month = $monthParam !== ''
            ? Carbon::createFromFormat('Y-m', $monthParam, config('app.timezone'))->startOfMonth()
            : now()->startOfMonth();

        $monthStart = $month->toDateString();
        $monthEnd = $month->copy()->endOfMonth()->toDateString();

        $query = Placement::with(['trainee', 'schedules'])
            // Placement overlaps the month if it starts before the month ends and ends after it starts.
            ->whereDate('start_date', '<=', $monthEnd)
            ->whereDate('end_date', '>=', $monthStart);

        if ($user->hasAnyRole(['dpo_staff', 'system_administrator'])) {
            // DPO/admin see every placement.
        } elseif ($user->hasRole('department_coordinator')) {
            $query->where('coordinator_id', $user->id);
        } else {
            // Trainees (and any other role) only ever see their own deployment.
            $query->where('trainee_id', $user->id);
        }

        $placements = $query->orderBy('start_date')->get()->map(fn (Placement $p) => [
            'id' => $p->id,
            'trainee_id' => $p->trainee_id,
            'trainee_name' => $p->trainee?->name ?? $p->traineeFullName(),
            'department_assigned' => $p->department_assigned,
            'enrolled_school' => $p->enrolled_school,
            'trainee_type' => $p->trainee_type,
            'start_date' => $p->start_date->toDateString(),
            'end_date' => $p->end_date->toDateString(),
            'schedules' => $p->schedules->map(fn ($s) => [
                'id' => $s->id,
                'day_of_week' => $s->day_of_week,
                'start_time' => $s->start_time,
                'end_time' => $s->end_time,
                'location' => $s->location,
                'notes' => $s->notes,
            ])->values(),
        ])->values();

        return Inertia::render('Dpnda/Calendar', [
            'placements' => $placements,
            'month' => $month->format('Y-m'),
        ]);
    }
}
