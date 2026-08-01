<?php

namespace App\Modules\Dpnda\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Dpnda\Models\Placement;
use App\Modules\Dpnda\Models\TraineeSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// Trainee self-service weekly whereabouts (OJT "where will you be" schedule). The trainee owns
// their own blocks (create/edit/delete, no approval); coordinators and DPO staff get read-only,
// role-scoped visibility. The deployment calendar (DpndaCalendarController) visualizes these.
class TraineeScheduleController extends Controller
{
    private const TRAINEE_ROLES = ['ojt_trainee_internal', 'ojt_trainee_external'];

    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = TraineeSchedule::with(['placement.trainee', 'placement.coordinator']);

        if ($user->hasAnyRole(['dpo_staff', 'system_administrator'])) {
            // DPO/admin see every trainee's schedule.
        } elseif ($user->hasRole('department_coordinator')) {
            $query->whereHas('placement', fn ($q) => $q->where('coordinator_id', $user->id));
        } else {
            // Trainees (and any other role) only ever see their own.
            $query->whereHas('placement', fn ($q) => $q->where('trainee_id', $user->id));
        }

        $schedules = $query->orderBy('day_of_week')->orderBy('start_time')->get();

        // For the trainee's self-service page: their active (else most recent) placement, so the
        // UI can show the deployment context and prefill the location even before any block exists.
        $myPlacement = null;
        if ($user->hasAnyRole(self::TRAINEE_ROLES)) {
            $placements = Placement::where('trainee_id', $user->id)->orderByDesc('start_date')->get();
            $today = now()->toDateString();
            $myPlacement = $placements->first(
                fn (Placement $p) => $p->start_date->toDateString() <= $today && $p->end_date->toDateString() >= $today,
            ) ?? $placements->first();
        }

        return Inertia::render('Dpnda/Schedules', [
            'schedules' => $schedules,
            'myPlacement' => $myPlacement,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateBlock($request);

        $placement = Placement::findOrFail($validated['placement_id']);
        if ($placement->trainee_id !== $request->user()->id) {
            abort(403, 'You can only manage your own schedule.');
        }

        TraineeSchedule::create($validated);

        return back()->with('success', 'Schedule block added.');
    }

    public function update(Request $request, TraineeSchedule $schedule): RedirectResponse
    {
        $this->authorize('manage', $schedule);

        $validated = $this->validateBlock($request, $schedule->placement_id);
        // A block always stays on its original placement — ignore any client-supplied placement_id.
        $validated['placement_id'] = $schedule->placement_id;

        $schedule->update($validated);

        return back()->with('success', 'Schedule block updated.');
    }

    public function destroy(Request $request, TraineeSchedule $schedule): RedirectResponse
    {
        $this->authorize('manage', $schedule);

        $schedule->delete();

        return back()->with('success', 'Schedule block removed.');
    }

    /**
     * @return array{placement_id: int, day_of_week: int, start_time: string, end_time: string, location: string, notes: ?string}
     */
    private function validateBlock(Request $request, ?int $placementId = null): array
    {
        $validated = $request->validate([
            'placement_id' => [$placementId === null ? 'required' : 'nullable', 'integer', 'exists:placements,id'],
            'day_of_week' => ['required', 'integer', 'between:0,6'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'location' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        if ($placementId !== null) {
            $validated['placement_id'] = $placementId;
        }

        return $validated;
    }
}
