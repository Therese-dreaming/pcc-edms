<?php

namespace App\Modules\Remis\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Monitoring\Models\ProgressReport;
use App\Modules\Remis\Monitoring\Services\RemisMonitoringService;
use App\Modules\Remis\Services\RemisWorkflowService;
use App\Shared\Documents\Services\DocumentService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

// docs/3.1-3.5 — the Ethics track. Policy-gated per docs/0.2's capability matrix.
class RemisApplicationController extends Controller
{
    public function __construct(
        private readonly RemisWorkflowService $workflow,
        private readonly RemisMonitoringService $monitoring,
        private readonly DocumentService $documents,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canSeeAll = $user->hasAnyRole(['ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair', 'system_administrator']);

        $scope = function ($query) use ($user, $canSeeAll) {
            if (! $canSeeAll) {
                $query->where(function ($q) use ($user) {
                    $q->where('applicant_id', $user->id)->orWhere('adviser_id', $user->id);
                });
            }
        };

        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status');

        $query = RemisApplication::with('researchApplication')->latest();
        $scope($query);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('tracking_number', 'like', "%{$search}%")
                    ->orWhereHas('researchApplication', fn ($rq) => $rq->where('research_title', 'like', "%{$search}%"));
            });
        }

        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $countsQuery = RemisApplication::query();
        $scope($countsQuery);

        return Inertia::render('Remis/Index', [
            'applications' => $query->paginate(15)->withQueryString(),
            'filters' => ['search' => $search, 'status' => $status ?: 'all'],
            'statusCounts' => $countsQuery->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
        ]);
    }

    public function show(RemisApplication $remisApplication): Response
    {
        $this->authorize('view', $remisApplication);

        $remisApplication->load([
            'researchApplication.applicant',
            'endorsementActions.endorser',
            'riskClassification',
            'reviewAssignments.reviewer',
            'decision',
            'statusHistory.changedBy',
            'documents',
            'progressReports.submitter',
            'progressReports.reviewer',
            'completionReport',
        ]);

        return Inertia::render('Remis/Show', [
            'application' => $remisApplication,
            'legalTransitions' => RemisApplication::LEGAL_TRANSITIONS[$remisApplication->status] ?? [],
        ]);
    }

    public function endorse(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('endorse', $remisApplication);
        $validated = $request->validate([
            'action' => ['required', 'in:approve,return,reject'],
            'remarks' => ['nullable', 'string'],
            'signature' => ['required', 'string'],
            'signature_image' => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:200000'],
        ]);

        try {
            $this->workflow->endorse(
                $remisApplication,
                $remisApplication->current_endorsement_step,
                $request->user()->id,
                $validated['action'],
                $validated['remarks'] ?? null,
                $validated['signature'],
                $validated['signature_image'] ?? null,
            );
        } catch (RuntimeException $e) {
            return back()->withErrors(['endorse' => $e->getMessage()]);
        }

        return back()->with('success', 'Endorsement recorded.');
    }

    public function resubmit(RemisApplication $remisApplication): RedirectResponse
    {
        if ($remisApplication->applicant_id !== request()->user()->id) {
            abort(403);
        }

        $this->workflow->resubmitFromRevision($remisApplication);

        return back()->with('success', 'Application resubmitted.');
    }

    public function screen(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('screen', $remisApplication);
        $validated = $request->validate([
            'decision' => ['required', 'in:complete,incomplete,returned_for_compliance'],
            'comments' => ['nullable', 'string'],
        ]);

        $this->workflow->screen($remisApplication, $validated['decision'], $validated['comments'] ?? null);

        return back()->with('success', 'Screening recorded.');
    }

    public function assignReviewer(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('assignReviewer', $remisApplication);
        $validated = $request->validate(['reviewer_email' => ['required', 'email', 'exists:users,email']]);

        $reviewer = User::where('email', $validated['reviewer_email'])->firstOrFail();

        try {
            $this->workflow->assignReviewer($remisApplication, $reviewer->id);
        } catch (RuntimeException $e) {
            return back()->withErrors(['reviewer_email' => $e->getMessage()]);
        }

        return back()->with('success', 'Reviewer assigned.');
    }

    public function submitReview(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('reviewAsAssignedReviewer', $remisApplication);
        $validated = $request->validate([
            'risk_level' => ['required', 'in:minimal,moderate,high'],
            'rationale' => ['required', 'string'],
            'recommendation' => ['required', 'in:approve,minor_revision,major_revision,disapprove'],
            'comments' => ['required', 'string'],
        ]);

        // docs/3.3 FRS §VIII — a panel of reviewers, each with their own `review_assignments` row;
        // this finds *this* reviewer's own unsubmitted row rather than assuming there's only one.
        $assignment = $remisApplication->reviewAssignments()
            ->where('reviewer_id', $request->user()->id)
            ->whereNull('submitted_at')
            ->firstOrFail();

        $this->workflow->classifyRiskAndRecommend(
            $assignment,
            $validated['risk_level'],
            $validated['rationale'],
            $validated['recommendation'],
            $validated['comments'],
        );

        return back()->with('success', 'Review submitted.');
    }

    public function decide(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('decide', $remisApplication);
        $validated = $request->validate([
            'outcome' => ['required', 'in:approved,approved_with_conditions,deferred,disapproved'],
            'conditions' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
            'signature' => ['required', 'string'],
            'signature_image' => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:200000'],
        ]);

        try {
            $this->workflow->decide(
                $remisApplication,
                $validated['outcome'],
                $request->user()->id,
                $validated['conditions'] ?? null,
                $validated['remarks'] ?? null,
                $validated['signature'],
                $validated['signature_image'] ?? null,
            );
        } catch (RuntimeException $e) {
            return back()->withErrors(['decide' => $e->getMessage()]);
        }

        return back()->with('success', 'Decision issued.');
    }

    public function submitProgressReport(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('submitProgressReport', $remisApplication);
        $validated = $request->validate([
            'status_of_study' => ['required', 'string', 'max:255'],
            'participants_recruited' => ['required', 'integer', 'min:0'],
            'ethics_concerns' => ['nullable', 'string'],
            'protocol_deviations' => ['nullable', 'string'],
            'corrective_actions' => ['nullable', 'string'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:51200'],
        ]);

        try {
            $report = $this->monitoring->submitProgressReport($remisApplication, $validated, $request->user()->id);
        } catch (RuntimeException $e) {
            return back()->withErrors(['progress_report' => $e->getMessage()]);
        }

        $this->storeSupportingDocuments($request, $report, $remisApplication, 'ProgressReportSupportingDocument');

        return back()->with('success', 'Progress report submitted.');
    }

    public function reviewProgressReport(Request $request, ProgressReport $progressReport): RedirectResponse
    {
        $this->authorize('review', $progressReport);
        $validated = $request->validate([
            'compliance_status' => ['required', 'in:compliant,minor_issues,major_issues,non_compliant'],
            'review_notes' => ['nullable', 'string'],
        ]);

        $this->monitoring->reviewProgressReport(
            $progressReport,
            $validated['compliance_status'],
            $validated['review_notes'] ?? null,
            $request->user()->id,
        );

        return back()->with('success', 'Progress report reviewed.');
    }

    public function submitCompletionReport(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('submitCompletionReport', $remisApplication);
        $validated = $request->validate([
            'completion_date' => ['required', 'date'],
            'final_participant_count' => ['required', 'integer', 'min:0'],
            'compliance_statement' => ['required', 'string'],
            'publication_status' => ['required', 'string', 'max:255'],
            'data_storage_location' => ['required', 'string', 'max:255'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:51200'],
        ]);

        try {
            $completion = $this->monitoring->submitCompletionReport($remisApplication, $validated, $request->user()->id);
        } catch (RuntimeException $e) {
            return back()->withErrors(['completion_report' => $e->getMessage()]);
        }

        $this->storeSupportingDocuments($request, $completion, $remisApplication, 'FinalOutputs');

        return back()->with('success', 'Completion report submitted — study closed and archived.');
    }

    private function storeSupportingDocuments(Request $request, $documentable, RemisApplication $remisApplication, string $documentType): void
    {
        if (! $request->hasFile('documents')) {
            return;
        }

        $year = $remisApplication->created_at->year;

        foreach ($request->file('documents') as $file) {
            $this->documents->store(
                $documentable,
                $file,
                $documentType,
                'REMIS',
                $remisApplication->tracking_number,
                "ORD/REMIS/{$year}/{$remisApplication->tracking_number}",
            );
        }
    }

    public function downloadClearancePdf(RemisApplication $remisApplication): StreamedResponse
    {
        $this->authorize('view', $remisApplication);

        $certificate = $remisApplication->researchApplication->clearanceCertificate;

        if (! $certificate || ! $certificate->isIssued()) {
            abort(404, 'Clearance not yet issued.');
        }

        $document = $certificate->pdfDocument;

        return Storage::disk('documents')->download($document->file_path, $document->original_filename);
    }
}
