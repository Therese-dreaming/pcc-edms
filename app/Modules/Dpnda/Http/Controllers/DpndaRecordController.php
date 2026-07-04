<?php

namespace App\Modules\Dpnda\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Dpnda\Http\Requests\StorePlacementRequest;
use App\Modules\Dpnda\Models\DpndaRecord;
use App\Modules\Dpnda\Services\DpndaWorkflowService;
use App\Modules\Dpnda\Services\OjtEvaluationReportService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

// docs/2.1-dpnda-nda-template.md §2.1.b, docs/2.2-dpnda-workflow.md — OJT/Trainee NDA (Form 5).
class DpndaRecordController extends Controller
{
    public function __construct(
        private readonly DpndaWorkflowService $workflow,
        private readonly OjtEvaluationReportService $evaluationReports,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = DpndaRecord::with('placement')->latest();

        if (! $user->hasAnyRole(['dpo_staff', 'dpo_approver', 'system_administrator'])) {
            $query->whereHas('placement', function ($q) use ($user) {
                $q->where('coordinator_id', $user->id)->orWhere('trainee_id', $user->id);
            });
        }

        return Inertia::render('Dpnda/Index', [
            'records' => $query->get(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', DpndaRecord::class);

        return Inertia::render('Dpnda/Create');
    }

    public function store(StorePlacementRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $trainee = User::where('email', $validated['trainee_email'])->firstOrFail();
        unset($validated['trainee_email']);

        $record = $this->workflow->createPlacement([...$validated, 'trainee_id' => $trainee->id], $request->user()->id);

        return redirect()->route('dpnda.show', $record)
            ->with('success', "NDA {$record->tracking_number} created.");
    }

    public function show(DpndaRecord $dpndaRecord): Response
    {
        $this->authorize('view', $dpndaRecord);

        $dpndaRecord->load(['placement.trainee', 'placement.coordinator', 'placement.ojtEvaluationReport.uploader', 'statusHistory.changedBy', 'documents']);

        return Inertia::render('Dpnda/Show', [
            'record' => $dpndaRecord,
            'legalTransitions' => DpndaRecord::LEGAL_TRANSITIONS[$dpndaRecord->status] ?? [],
        ]);
    }

    public function sendForSigning(DpndaRecord $dpndaRecord): RedirectResponse
    {
        $this->authorize('sendForSigning', $dpndaRecord);
        $this->workflow->sendForSigning($dpndaRecord);

        return back()->with('success', 'Sent to trainee for signing.');
    }

    public function sign(Request $request, DpndaRecord $dpndaRecord): RedirectResponse
    {
        $this->authorize('sign', $dpndaRecord);
        $validated = $request->validate([
            'typed_full_name' => ['required', 'string'],
            'signature_image' => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:200000'],
        ]);

        try {
            $this->workflow->traineeSign($dpndaRecord, $validated['typed_full_name'], $validated['signature_image'] ?? null);
        } catch (RuntimeException $e) {
            return back()->withErrors(['nda' => $e->getMessage()]);
        }

        return back()->with('success', 'NDA signed.');
    }

    public function decline(Request $request, DpndaRecord $dpndaRecord): RedirectResponse
    {
        $this->authorize('decline', $dpndaRecord);
        $validated = $request->validate(['reason' => ['required', 'string']]);
        $this->workflow->decline($dpndaRecord, $validated['reason']);

        return back()->with('success', 'NDA declined.');
    }

    public function countersign(Request $request, DpndaRecord $dpndaRecord): RedirectResponse
    {
        $this->authorize('countersign', $dpndaRecord);
        $validated = $request->validate([
            'typed_full_name' => ['required', 'string'],
            'signature_image' => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:200000'],
        ]);

        try {
            $this->workflow->coordinatorCountersign($dpndaRecord, $validated['typed_full_name'], $validated['signature_image'] ?? null);
        } catch (RuntimeException $e) {
            return back()->withErrors(['nda' => $e->getMessage()]);
        }

        return back()->with('success', 'NDA countersigned and completed.');
    }

    public function uploadEvaluationReport(Request $request, DpndaRecord $dpndaRecord): RedirectResponse
    {
        $placement = $dpndaRecord->placement;
        $this->authorize('uploadEvaluationReport', $placement);

        $validated = $request->validate([
            'document' => ['required', 'file', 'max:10240'],
            'notes' => ['nullable', 'string'],
        ]);

        try {
            $this->evaluationReports->upload($placement, $validated['document'], $validated['notes'] ?? null, $request->user()->id);
        } catch (RuntimeException $e) {
            return back()->withErrors(['evaluation_report' => $e->getMessage()]);
        }

        return back()->with('success', 'Evaluation report uploaded.');
    }

    public function downloadPdf(DpndaRecord $dpndaRecord): StreamedResponse
    {
        $this->authorize('view', $dpndaRecord);

        $document = $dpndaRecord->documents()
            ->where('is_current_version', true)
            ->latest()
            ->firstOrFail();

        return Storage::disk('documents')->download($document->file_path, $document->original_filename);
    }
}
