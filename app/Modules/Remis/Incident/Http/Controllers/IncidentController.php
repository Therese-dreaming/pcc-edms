<?php

namespace App\Modules\Remis\Incident\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Remis\Incident\Models\Incident;
use App\Modules\Remis\Incident\Services\IncidentService;
use App\Modules\Remis\Models\RemisApplication;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

// docs/3.5-remis-incident-reporting.md
class IncidentController extends Controller
{
    public function __construct(private readonly IncidentService $incidents)
    {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Incident::with('remisApplication')->latest();

        if (! $user->hasAnyRole(['ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair', 'dpo_staff', 'dpo_approver', 'system_administrator'])) {
            $query->where(function ($q) use ($user) {
                $q->where('reported_by', $user->id)
                    ->orWhere('assigned_to', $user->id)
                    ->orWhereHas('remisApplication', fn ($rq) => $rq->where('applicant_id', $user->id));
            });
        }

        return Inertia::render('Incidents/Index', [
            'incidents' => $query->get(),
        ]);
    }

    public function create(Request $request, RemisApplication $remisApplication): Response
    {
        $this->authorize('file', $remisApplication);

        return Inertia::render('Incidents/Create', [
            'remisApplication' => $remisApplication->only(['id', 'tracking_number']),
        ]);
    }

    public function store(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('file', $remisApplication);

        $validated = $request->validate([
            'incident_type' => ['required', 'in:participant_complaint,data_breach,confidentiality_breach,psychological_harm,protocol_violation,other'],
            'severity' => ['required', 'in:low,medium,high,critical'],
            'incident_date' => ['required', 'date'],
            'description' => ['required', 'string'],
            'immediate_actions' => ['nullable', 'string'],
        ]);

        $incident = $this->incidents->file($remisApplication, $validated, $request->user()->id);

        return redirect()->route('incidents.show', $incident)->with('success', 'Incident reported.');
    }

    public function show(Incident $incident): Response
    {
        $this->authorize('view', $incident);

        $incident->load(['remisApplication', 'reporter', 'assignee', 'verifier', 'statusHistory.changedBy']);

        return Inertia::render('Incidents/Show', [
            'incident' => $incident,
            'legalTransitions' => Incident::LEGAL_TRANSITIONS[$incident->status] ?? [],
        ]);
    }

    public function assign(Request $request, Incident $incident): RedirectResponse
    {
        $this->authorize('manage', $incident);
        $validated = $request->validate(['assignee_email' => ['required', 'email', 'exists:users,email']]);

        $assignee = \App\Models\User::where('email', $validated['assignee_email'])->firstOrFail();
        $this->incidents->assign($incident, $assignee->id);

        return back()->with('success', 'Incident assigned.');
    }

    public function addNote(Request $request, Incident $incident): RedirectResponse
    {
        $this->authorize('manage', $incident);
        $validated = $request->validate(['note' => ['required', 'string']]);

        $this->incidents->addInvestigationNote($incident, $request->user()->name, $validated['note']);

        return back()->with('success', 'Note added.');
    }

    public function transition(Request $request, Incident $incident): RedirectResponse
    {
        $this->authorize('manage', $incident);
        $validated = $request->validate(['status' => ['required', 'in:under_investigation,corrective_action_in_progress,resolved,closed']]);

        try {
            $this->incidents->transition($incident, $validated['status']);
        } catch (RuntimeException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return back()->with('success', 'Status updated.');
    }

    public function setCorrectiveAction(Request $request, Incident $incident): RedirectResponse
    {
        $this->authorize('manage', $incident);
        $validated = $request->validate([
            'corrective_action_required' => ['required', 'string'],
            'corrective_action_due_date' => ['required', 'date'],
        ]);

        $this->incidents->setCorrectiveAction($incident, $validated['corrective_action_required'], $validated['corrective_action_due_date']);

        return back()->with('success', 'Corrective action recorded.');
    }

    public function completeCorrectiveAction(Incident $incident): RedirectResponse
    {
        $this->authorize('manage', $incident);
        $this->incidents->completeCorrectiveAction($incident);

        return back()->with('success', 'Corrective action marked completed.');
    }

    public function verifyCorrectiveAction(Request $request, Incident $incident): RedirectResponse
    {
        $this->authorize('manage', $incident);

        try {
            $this->incidents->verifyCorrectiveAction($incident, $request->user()->id);
        } catch (RuntimeException $e) {
            return back()->withErrors(['corrective_action' => $e->getMessage()]);
        }

        return back()->with('success', 'Corrective action verified.');
    }
}
