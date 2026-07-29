<?php

namespace App\Modules\Dpnda\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Dpnda\Http\Requests\StorePlacementRequest;
use App\Modules\Dpnda\Models\DpndaRecord;
use App\Modules\Dpnda\Services\DpndaWorkflowService;
use App\Modules\Dpnda\Services\OjtEvaluationReportService;
use App\Shared\AuditLog\Services\AuditLogService;
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
        private readonly AuditLogService $auditLog,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canSeeAll = $user->hasAnyRole(['dpo_staff', 'system_administrator']);

        $scope = function ($query) use ($user, $canSeeAll) {
            if (! $canSeeAll) {
                $query->whereHas('placement', function ($q) use ($user) {
                    $q->where('coordinator_id', $user->id)->orWhere('trainee_id', $user->id);
                });
            }
        };

        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status');

        $query = DpndaRecord::with('placement')->whereNull('archived_at')->latest();
        $scope($query);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('tracking_number', 'like', "%{$search}%")
                    ->orWhereHas('placement', function ($pq) use ($search) {
                        $pq->whereRaw(
                            "concat(trainee_first_name, ' ', trainee_last_name) like ?",
                            ["%{$search}%"],
                        );
                    });
            });
        }

        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $countsQuery = DpndaRecord::query()->whereNull('archived_at');
        $scope($countsQuery);

        return Inertia::render('Dpnda/Index', [
            'records' => $query->paginate(15)->withQueryString(),
            'filters' => ['search' => $search, 'status' => $status ?: 'all'],
            'statusCounts' => $countsQuery->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
        ]);
    }

    // Register bulk actions (DPNDA index Actions menu). Authorized per-record.
    public function bulkArchive(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];

        $count = 0;
        foreach (DpndaRecord::whereIn('id', $ids)->get() as $record) {
            if ($request->user()->can('archive', $record) && $record->archived_at === null) {
                $record->update(['archived_at' => now()]);
                $this->auditLog->record('dpnda_record.archived', $record, null, ['archived_at' => now()->toDateTimeString()]);
                $count++;
            }
        }

        return back()->with('success', $count === 1 ? '1 record archived.' : "{$count} records archived.");
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];

        $count = 0;
        foreach (DpndaRecord::whereIn('id', $ids)->get() as $record) {
            if ($request->user()->can('delete', $record)) {
                $this->auditLog->record('dpnda_record.deleted', $record, $record->toArray(), null);
                $record->delete(); // soft delete — recoverable
                $count++;
            }
        }

        return back()->with('success', $count === 1 ? '1 record deleted.' : "{$count} records deleted.");
    }

    public function create(): Response
    {
        $this->authorize('create', DpndaRecord::class);

        return Inertia::render('Dpnda/Create');
    }

    public function store(StorePlacementRequest $request, \App\Shared\Auth\Services\AdminUserService $users): RedirectResponse
    {
        $validated = $request->validated();

        // Item 3 — resolve the trainee, or create the account for a transferee who has none and
        // email them a setup link (same activation path as an admin-created account).
        $trainee = User::where('email', $validated['trainee_email'])->first();
        $invited = false;

        if ($trainee === null) {
            $roleSlug = $validated['trainee_type'] === 'external_ojt' ? 'ojt_trainee_external' : 'ojt_trainee_internal';
            $trainee = $users->createApplicant(
                [
                    'name' => trim("{$validated['trainee_first_name']} {$validated['trainee_last_name']}"),
                    'email' => $validated['trainee_email'],
                    'role_id' => \App\Shared\Auth\Models\Role::where('name', $roleSlug)->value('id'),
                    'department' => $validated['department'] ?? null,
                ],
                auditEvent: 'user.trainee_created_by_coordinator',
            );
            $invited = true;
        }

        unset($validated['trainee_email']);

        $record = $this->workflow->createPlacement([...$validated, 'trainee_id' => $trainee->id], $request->user()->id);

        $message = "NDA {$record->tracking_number} created.";
        if ($invited) {
            $message .= " An account setup link was emailed to {$trainee->email}.";
        }

        return redirect()->route('dpnda.show', $record)->with('success', $message);
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
            'document' => ['required', 'file', 'max:51200'],
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
