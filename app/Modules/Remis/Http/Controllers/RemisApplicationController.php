<?php

namespace App\Modules\Remis\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Monitoring\Models\ProgressReport;
use App\Modules\Remis\Monitoring\Services\RemisMonitoringService;
use App\Modules\Remis\Services\RemisWorkflowService;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\Concurrency\Exceptions\StaleRecordException;
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
    use \App\Shared\Concurrency\Concerns\ChecksRecordVersion;
    use \App\Shared\Auth\Concerns\ConfirmsPassword;

    public function __construct(
        private readonly RemisWorkflowService $workflow,
        private readonly RemisMonitoringService $monitoring,
        private readonly DocumentService $documents,
        private readonly AuditLogService $auditLog,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canSeeAll = $user->hasAnyRole(['ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair', 'system_administrator']);

        // Endorsers can see applications assigned to them or already pending their review
        $isEndorser = $user->hasAnyRole(['adviser', 'program_head', 'dean']);

        $scope = function ($query) use ($user, $canSeeAll, $isEndorser) {
            if ($canSeeAll) {
                // Ethics staff/reviewers/chair see all
                return;
            }

            if ($isEndorser) {
                // Endorsers see: their own submissions, applications they own as adviser (any
                // status, so they can follow a student through the whole lifecycle), plus whatever
                // is currently queued at their own endorsement step.
                $query->where(function ($q) use ($user) {
                    $q->where('applicant_id', $user->id)
                        ->orWhere('adviser_id', $user->id)
                        ->orWhere(function ($subQ) use ($user) {
                            $subQ->where('status', 'under_endorsement');

                            if ($user->hasRole('adviser')) {
                                // Only the adviser step (this previously had no step filter at all, so
                                // advisers also saw applications sitting with the program head or
                                // dean), and only the UNASSIGNED pool — their own students' are
                                // already covered by the adviser_id clause above. Applications with a
                                // null adviser_id have no owner, so they must stay visible to
                                // advisers or nobody would ever endorse them.
                                $subQ->where('current_endorsement_step', 'adviser')
                                    ->whereNull('adviser_id');
                            }

                            if ($user->hasRole('program_head')) {
                                // Program head sees applications where adviser has endorsed
                                $subQ->where('current_endorsement_step', 'program_head');
                            }

                            if ($user->hasRole('dean')) {
                                // Dean sees applications where program head has endorsed
                                $subQ->where('current_endorsement_step', 'dean');
                            }
                        });
                });
            } else {
                // Regular researchers only see their own
                $query->where('applicant_id', $user->id);
            }
        };

        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status');

        $query = RemisApplication::with('researchApplication')->whereNull('archived_at')->latest();
        $scope($query);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('tracking_number', 'like', "%{$search}%")
                    ->orWhereHas('researchApplication', fn($rq) => $rq->where('research_title', 'like', "%{$search}%"));
            });
        }

        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $countsQuery = RemisApplication::query()->whereNull('archived_at');
        $scope($countsQuery);

        return Inertia::render('Remis/Index', [
            'applications' => $query->paginate(15)->withQueryString(),
            'filters' => ['search' => $search, 'status' => $status ?: 'all'],
            'statusCounts' => $countsQuery->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
        ]);
    }

    // Register bulk actions (REMIS index Actions menu). Authorized per-record.
    public function bulkArchive(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];

        $count = 0;
        foreach (RemisApplication::whereIn('id', $ids)->get() as $application) {
            if ($request->user()->can('archive', $application) && $application->archived_at === null) {
                $application->update(['archived_at' => now()]);
                $this->auditLog->record('remis_application.archived', $application, null, ['archived_at' => now()->toDateTimeString()]);
                $count++;
            }
        }

        return back()->with('success', $count === 1 ? '1 application archived.' : "{$count} applications archived.");
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];

        $count = 0;
        foreach (RemisApplication::whereIn('id', $ids)->get() as $application) {
            if ($request->user()->can('delete', $application)) {
                $this->auditLog->record('remis_application.deleted', $application, $application->toArray(), null);
                $application->delete(); // soft delete — recoverable
                $count++;
            }
        }

        return back()->with('success', $count === 1 ? '1 application deleted.' : "{$count} applications deleted.");
    }

    public function show(RemisApplication $remisApplication): Response
    {
        $this->authorize('view', $remisApplication);

        // docs/4.4 (B5, 2026-08-31): record access is logged for sensitive records.
        $this->auditLog->record('remis_application.viewed', $remisApplication);

        $remisApplication->load([
            'researchApplication.applicant',
            'researchApplication.clearanceCertificate.dpoSignedBy',
            'researchApplication.clearanceCertificate.ethicsSignedBy',
            // The additional (DPO-side) uploads and the generated Form 1 live on the DPREQ sibling —
            // load them so the shared "Submitted Documents" list and Form 1 appear here too
            // (concern 5/6, 2026-07-28).
            'researchApplication.dpreqApplication.documents.uploadedBy',
            'endorsementActions.endorser',
            'riskClassification',
            'reviewAssignments.reviewer',
            'reviewAssignments.riskClassification',
            'reviewAssignments.criteriaAssessments',
            'screeningChecklists.screener',
            'decision',
            'statusHistory.changedBy',
            'documents.uploadedBy',
            'progressReports.submitter',
            'progressReports.reviewer',
            'completionReport',
            'revisionRequests.responses',
            'amendments',
        ]);

        $user = request()->user();

        return Inertia::render('Remis/Show', [
            'application' => $remisApplication,
            'legalTransitions' => RemisApplication::LEGAL_TRANSITIONS[$remisApplication->status] ?? [],
            'revisions' => [
                'track' => 'remis',
                'applicationId' => $remisApplication->id,
                'items' => $remisApplication->revisionRequests,
                'amendments' => $remisApplication->amendments,
                'canRaise' => $user->hasAnyRole(['ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair', 'system_administrator']),
                'isApplicant' => $remisApplication->applicant_id === $user->id,
                'canAmend' => $remisApplication->applicant_id === $user->id && $remisApplication->status === 'for_revision',
                'amendableFields' => RemisApplication::AMENDABLE_FIELDS,
            ],
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

        // C2 (concern 10) — rejecting an endorsement requires the endorser's own password.
        if ($validated['action'] === 'reject') {
            $this->confirmPassword($request);
        }

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

        try {
            $this->workflow->resubmitFromRevision($remisApplication);
        } catch (RuntimeException $e) {
            return back()->withErrors(['resubmit' => $e->getMessage()]);
        }

        return back()->with('success', 'Application resubmitted.');
    }

    // FRS §IX / confirmed edit policy — the applicant amends specific fields while for_revision.
    // Every change is recorded as an amendment (old -> new + reason); the original is never
    // silently overwritten.
    public function amend(Request $request, RemisApplication $remisApplication, \App\Shared\Revisions\Services\AmendmentService $amendments): RedirectResponse
    {
        abort_unless($remisApplication->applicant_id === $request->user()->id, 403);

        $validated = $request->validate([
            'changes' => ['required', 'array', 'min:1'],
            'changes.*' => ['nullable'],
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        // Only whitelisted study fields are amendable by the applicant.
        $changes = array_intersect_key($validated['changes'], array_flip(RemisApplication::AMENDABLE_FIELDS));

        if ($changes === []) {
            return back()->withErrors(['changes' => 'No editable fields were provided.']);
        }

        try {
            $amendments->apply($remisApplication, $changes, $validated['reason'], $request->user(), ['for_revision']);
        } catch (RuntimeException $e) {
            return back()->withErrors(['changes' => $e->getMessage()]);
        }

        return back()->with('success', 'Amendment recorded.');
    }

    public function screen(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('screen', $remisApplication);
        $validated = $request->validate([
            'decision' => ['required', 'in:complete,incomplete,returned_for_compliance'],
            'comments' => ['nullable', 'string'],
            // FRS §VI five-item completeness checklist.
            'checklist' => ['array'],
            'checklist.proposal_attached' => ['boolean'],
            'checklist.consent_form_attached' => ['boolean'],
            'checklist.instrument_attached' => ['boolean'],
            'checklist.signatures_complete' => ['boolean'],
            'checklist.required_templates_used' => ['boolean'],
        ]);

        try {
            $this->workflow->screen(
                $remisApplication,
                $validated['decision'],
                $validated['comments'] ?? null,
                $validated['checklist'] ?? [],
                $request->user()->id,
            );
        } catch (RuntimeException $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }

        return back()->with('success', 'Screening recorded.');
    }

    public function assignReviewer(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('assignReviewer', $remisApplication);
        $validated = $request->validate(['reviewer_email' => ['required', 'email', 'exists:users,email']]);

        $reviewer = User::where('email', $validated['reviewer_email'])->firstOrFail();

        if (! $reviewer->hasRole('ethics_reviewer')) {
            return back()->withErrors(['reviewer_email' => 'The specified user does not hold the Ethics Reviewer role.']);
        }

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
            // FRS §VIII — seven-criteria assessment.
            'criteria' => ['array'],
            'criteria.*.verdict' => ['required_with:criteria', 'in:met,concerns,not_met'],
            'criteria.*.comment' => ['nullable', 'string', 'max:1000'],
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
            $validated['criteria'] ?? [],
        );

        return back()->with('success', 'Review submitted.');
    }

    public function decide(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('decide', $remisApplication);
        $validated = $request->validate([
            'outcome' => ['required', 'in:approved,approved_with_conditions,exempted,deferred,for_revision,disapproved'],
            'conditions' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
            'signature' => ['required', 'string'],
            'signature_image' => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:200000'],
            'expected_version' => ['nullable', 'integer'],
        ]);

        // C2 (concern 10) — a disapproval requires the deciding chair's own password.
        if ($validated['outcome'] === 'disapproved') {
            $this->confirmPassword($request);
        }

        try {
            $this->assertNotStale($remisApplication, $validated['expected_version'] ?? null);

            $this->workflow->decide(
                $remisApplication,
                $validated['outcome'],
                $request->user()->id,
                $validated['conditions'] ?? null,
                $validated['remarks'] ?? null,
                $validated['signature'],
                $validated['signature_image'] ?? null,
            );
        } catch (StaleRecordException $e) {
            return back()->withErrors(['decide' => 'This application was modified by another user. Please refresh and try again.']);
        } catch (RuntimeException $e) {
            return back()->withErrors(['decide' => $e->getMessage()]);
        }

        return back()->with('success', 'Decision issued.');
    }

    public function reactivate(RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('reactivate', $remisApplication);

        try {
            $this->workflow->reactivateFromDeferred($remisApplication);
        } catch (RuntimeException $e) {
            return back()->withErrors(['reactivate' => $e->getMessage()]);
        }

        return back()->with('success', 'Application reactivated for review.');
    }

    // docs/HANDOFF.md Part L — the researcher resumes monitoring after an incident auto-paused it.
    public function resumeMonitoring(Request $request, RemisApplication $remisApplication): RedirectResponse
    {
        $this->authorize('resumeMonitoring', $remisApplication);

        try {
            $this->workflow->resumeMonitoring($remisApplication, $request->user()->id);
        } catch (RuntimeException $e) {
            return back()->withErrors(['resume' => $e->getMessage()]);
        }

        return back()->with('success', 'Monitoring resumed.');
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
        if (!$request->hasFile('documents')) {
            return;
        }

        $year = $remisApplication->created_at->year;
        $department = $remisApplication->researchApplication?->department;

        foreach ($request->file('documents') as $file) {
            $this->documents->store(
                $documentable,
                $file,
                $documentType,
                'REMIS',
                $remisApplication->tracking_number,
                "ORD/REMIS/{$year}/{$remisApplication->tracking_number}",
                $department,
            );
        }
    }

    public function downloadClearancePdf(RemisApplication $remisApplication): StreamedResponse
    {
        $this->authorize('view', $remisApplication);

        $certificate = $remisApplication->researchApplication->clearanceCertificate;

        if (!$certificate || !$certificate->isRemisIssued()) {
            abort(404, 'Ethics clearance not yet issued.');
        }

        $document = $certificate->remisPdfDocument;

        return Storage::disk('documents')->download($document->file_path, $document->original_filename);
    }
}
