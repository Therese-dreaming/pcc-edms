<?php

namespace App\Modules\Dpreq\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Dpreq\Http\Requests\StoreDpreqApplicationRequest;
use App\Modules\Dpreq\Http\Requests\UpdateDpreqApplicationRequest;
use App\Modules\Dpreq\Jobs\GenerateDpreqFormPdfJob;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Dpreq\Models\ResearchTeamNdaSignatory;
use App\Modules\Dpreq\Services\DpreqWorkflowService;
use App\Modules\Dpreq\Services\ResearchTeamNdaService;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\Concurrency\Exceptions\StaleRecordException;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

// docs/1.1-1.3 (application), docs/1.2 (workflow) — the DPO track's Inertia controller.
class DpreqApplicationController extends Controller
{
    use \App\Shared\Concurrency\Concerns\ChecksRecordVersion;
    use \App\Shared\Auth\Concerns\ConfirmsPassword;

    public function __construct(
        private readonly ResearchApplicationService $researchApplications,
        private readonly DpreqWorkflowService $workflow,
        private readonly ResearchTeamNdaService $researchTeamNda,
        private readonly AuditLogService $auditLog,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canSeeAll = $user->hasAnyRole(['dpo_staff', 'system_administrator']);

        $scope = function ($query) use ($user, $canSeeAll) {
            if (!$canSeeAll) {
                $query->where('applicant_id', $user->id);
            }
        };

        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status');
        $sort = (string) $request->string('sort', 'newest');

        // Archived records drop out of the active register (kept, not deleted — see bulkArchive).
        $query = DpreqApplication::with('researchApplication')->whereNull('archived_at');
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

        // Apply sorting
        match ($sort) {
            'oldest' => $query->oldest(),
            'title_asc' => $query->join('research_applications', 'dpreq_applications.research_application_id', '=', 'research_applications.id')
                ->orderBy('research_applications.research_title', 'asc')
                ->select('dpreq_applications.*'),
            'title_desc' => $query->join('research_applications', 'dpreq_applications.research_application_id', '=', 'research_applications.id')
                ->orderBy('research_applications.research_title', 'desc')
                ->select('dpreq_applications.*'),
            default => $query->latest(),
        };

        $countsQuery = DpreqApplication::query()->whereNull('archived_at');
        $scope($countsQuery);

        // Calculate stats
        $stats = [
            'total_count' => (clone $countsQuery)->count(),
            'in_review' => (clone $countsQuery)->where('status', 'under_review')->count(),
            'cleared_this_month' => (clone $countsQuery)
                ->whereIn('status', ['approved', 'clearance_issued'])
                ->whereMonth('updated_at', now()->month)
                ->whereYear('updated_at', now()->year)
                ->count(),
            'cleared_last_month' => (clone $countsQuery)
                ->whereIn('status', ['approved', 'clearance_issued'])
                ->whereMonth('updated_at', now()->subMonth()->month)
                ->whereYear('updated_at', now()->subMonth()->year)
                ->count(),
        ];

        // Calculate average review days using status history
        $approvedApplications = (clone $countsQuery)
            ->whereIn('status', ['approved', 'clearance_issued'])
            ->with('statusHistory')
            ->get();

        $totalDays = 0;
        $count = 0;
        foreach ($approvedApplications as $app) {
            $submittedHistory = $app->statusHistory()->where('to_status', 'submitted')->first();
            $approvedHistory = $app->statusHistory()->whereIn('to_status', ['approved', 'clearance_issued'])->first();

            if ($submittedHistory && $approvedHistory) {
                $days = $submittedHistory->created_at->diffInDays($approvedHistory->created_at);
                $totalDays += $days;
                $count++;
            }
        }

        $stats['avg_review_days'] = $count > 0 ? round($totalDays / $count, 1) : 0;

        // Calculate percentage change
        $percentageChange = 0;
        if ($stats['cleared_last_month'] > 0) {
            $percentageChange = round((($stats['cleared_this_month'] - $stats['cleared_last_month']) / $stats['cleared_last_month']) * 100);
        } elseif ($stats['cleared_this_month'] > 0) {
            $percentageChange = 100;
        }

        return Inertia::render('Dpreq/Index', [
            'applications' => $query->paginate(15)->withQueryString(),
            'filters' => [
                'search' => $search,
                'status' => $status ?: 'all',
                'sort' => $sort,
            ],
            'statusCounts' => $countsQuery->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
            'stats' => [
                'total_count' => $stats['total_count'],
                'in_review' => $stats['in_review'],
                'avg_review_days' => $stats['avg_review_days'] ? round($stats['avg_review_days'], 1) : 0,
                'cleared_this_month' => $stats['cleared_this_month'],
                'percentage_change' => $percentageChange,
            ],
        ]);
    }

    // Register bulk actions (DPREQ index Actions menu). Each selected record is authorized
    // individually so a user can only archive/delete records they're allowed to.
    public function bulkArchive(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];

        $count = 0;
        foreach (DpreqApplication::whereIn('id', $ids)->get() as $application) {
            if ($request->user()->can('archive', $application) && $application->archived_at === null) {
                $application->update(['archived_at' => now()]);
                $this->auditLog->record('dpreq_application.archived', $application, null, ['archived_at' => now()->toDateTimeString()]);
                $count++;
            }
        }

        return back()->with('success', $count === 1 ? '1 application archived.' : "{$count} applications archived.");
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];

        $count = 0;
        foreach (DpreqApplication::whereIn('id', $ids)->get() as $application) {
            if ($request->user()->can('delete', $application)) {
                $this->auditLog->record('dpreq_application.deleted', $application, $application->toArray(), null);
                $application->delete(); // soft delete — recoverable
                $count++;
            }
        }

        return back()->with('success', $count === 1 ? '1 application deleted.' : "{$count} applications deleted.");
    }

    public function create(): Response
    {
        $this->authorize('create', DpreqApplication::class);

        return Inertia::render('Dpreq/Create', [
            'documentSlots' => \App\Shared\ResearchApplications\Support\ApplicationDocuments::forDisplay(),
            'fileLabels' => \App\Shared\Documents\Support\FileLabel::ALL,
            'uploadHint' => \App\Shared\Documents\Support\UploadRules::hint(),
            // B4 — Applicant Type is derived from the account role and shown read-only.
            'applicantType' => request()->user()->dpreqApplicantType(),
            // 2026-09-05 — student/employee is fixed on the account, so the form derives it instead
            // of asking; drives which fields (level/course/section vs position) render.
            'applicantCategory' => request()->user()->applicantCategory(),
            // The server's real POST ceiling (php.ini post_max_size). The form checks the total
            // attachment size against this BEFORE uploading, so an over-limit submission fails fast
            // with a clear message instead of a long upload ending in an opaque "POST too long" 413.
            'maxUploadBytes' => self::postMaxBytes(),
            // The per-file cap (UploadRules::MAX_KB). The form checks each file against it up front so
            // an over-cap file gets a clear "too large" message instead of PHP's bare "failed to
            // upload" (which fires before validation when a file exceeds upload_max_filesize).
            'maxFileBytes' => \App\Shared\Documents\Support\UploadRules::MAX_KB * 1024,
        ]);
    }

    // Parse php.ini's post_max_size (e.g. "256M") into bytes. 0 means "no limit" in PHP, which we
    // pass through as 0 so the client treats it as unbounded.
    private static function postMaxBytes(): int
    {
        $value = trim((string) ini_get('post_max_size'));
        if ($value === '' || $value === '0') {
            return 0;
        }

        $unit = strtolower($value[strlen($value) - 1]);
        $number = (int) $value;

        return match ($unit) {
            'g' => $number * 1024 * 1024 * 1024,
            'm' => $number * 1024 * 1024,
            'k' => $number * 1024,
            default => (int) $value,
        };
    }

    public function store(StoreDpreqApplicationRequest $request): RedirectResponse
    {
        $application = $this->researchApplications->submitForm1($request->validated(), $request->user());

        // docs/1.1 "Output" — render the submitted Form 1 to PDF (queued, so Chrome cold-start
        // never blocks this response). Downloadable from the application's Show page.
        GenerateDpreqFormPdfJob::dispatch($application->id, $request->user()->id);

        return redirect()->route('dpreq.show', $application)
            ->with('success', "Application {$application->tracking_number} submitted.");
    }

    public function show(DpreqApplication $dpreqApplication): Response
    {
        $this->authorize('view', $dpreqApplication);

        // docs/4.4 (B5, 2026-08-31): record access is logged for sensitive records.
        $this->auditLog->record('dpreq_application.viewed', $dpreqApplication);

        $dpreqApplication->load([
            'researchApplication.researchTeamNda.signatories',
            'researchApplication.researchTeamNda.documents',
            'researchApplication.clearanceCertificate.dpoSignedBy',
            'researchApplication.clearanceCertificate.ethicsSignedBy',
            // The mandatory intake uploads (proposal, instruments, letters, consent) attach to the
            // REMIS sibling — load them so the shared "Submitted Documents" list is complete on the
            // DPREQ side too (concern 5, 2026-07-28).
            'researchApplication.remisApplication.documents.uploadedBy',
            'documents.uploadedBy',
            'revisionRequests.responses',
            'statusHistory.changedBy',
            'applicant',
        ]);

        $user = request()->user();

        return Inertia::render('Dpreq/Show', [
            'application' => $dpreqApplication,
            'legalTransitions' => DpreqApplication::LEGAL_TRANSITIONS[$dpreqApplication->status] ?? [],
            'revisions' => [
                'track' => 'dpreq',
                'applicationId' => $dpreqApplication->id,
                'items' => $dpreqApplication->revisionRequests,
                'canRaise' => $user->hasAnyRole(['dpo_staff', 'system_administrator']),
                'isApplicant' => $dpreqApplication->applicant_id === $user->id,
            ],
        ]);
    }

    public function edit(DpreqApplication $dpreqApplication): Response
    {
        $this->authorize('update', $dpreqApplication);

        $dpreqApplication->load('researchApplication');

        return Inertia::render('Dpreq/Edit', [
            'application' => $dpreqApplication,
            'research' => $dpreqApplication->researchApplication,
            'applicantType' => $dpreqApplication->applicant_type,
        ]);
    }

    public function update(UpdateDpreqApplicationRequest $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('update', $dpreqApplication);

        $changed = $this->researchApplications->updateForm1($dpreqApplication, $request->validated(), $request->user());

        // A Form-1 field changed → regenerate the Form 1 PDF as a new version (bumps version control).
        // No change → leave the existing PDF untouched (stakeholder 2026-07-28).
        if ($changed) {
            GenerateDpreqFormPdfJob::dispatch($dpreqApplication->id, $request->user()->id);
        }

        return redirect()->route('dpreq.show', $dpreqApplication)
            ->with('success', $changed ? 'Application updated. Form 1 is being regenerated.' : 'No changes were made.');
    }

    public function startReview(DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('screen', $dpreqApplication);

        try {
            $this->workflow->startReview($dpreqApplication);
        } catch (RuntimeException $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }

        return back()->with('success', 'Application is now under review.');
    }

    public function returnForCorrection(Request $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('returnForCorrection', $dpreqApplication);
        $validated = $request->validate(['comments' => ['required', 'string']]);
        $this->workflow->returnForCorrection($dpreqApplication, $validated['comments']);

        return back()->with('success', 'Application returned to applicant.');
    }

    public function resubmit(DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('resubmit', $dpreqApplication);

        try {
            $this->workflow->resubmit($dpreqApplication);
        } catch (RuntimeException $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }

        return back()->with('success', 'Application resubmitted.');
    }

    public function approve(Request $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('approve', $dpreqApplication);

        $validated = $request->validate(['expected_version' => ['nullable', 'integer']]);

        try {
            $this->assertNotStale($dpreqApplication, $validated['expected_version'] ?? null);

            $this->workflow->approve($dpreqApplication, $request->user()->id);
        } catch (StaleRecordException $e) {
            return back()->withErrors(['nda' => 'This application was modified by another user. Please refresh and try again.']);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['nda' => $e->getMessage()]);
        }

        return back()->with('success', 'Application approved.');
    }

    public function reject(Request $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('reject', $dpreqApplication);
        $validated = $request->validate(['reason' => ['required', 'string']]);

        // C2 (concern 10) — a rejection requires the acting DPO to re-enter their own password.
        $this->confirmPassword($request);

        try {
            $this->workflow->reject($dpreqApplication, $validated['reason']);
        } catch (RuntimeException $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }

        return back()->with('success', 'Application rejected.');
    }

    // B3 (concern 3.4) — a System Administrator reassigns the group's lead (e.g. the original
    // leader transferred schools). The new lead must already have an account.
    public function transferOwnership(Request $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        abort_unless($request->user()->hasRole('system_administrator'), 403);

        $validated = $request->validate(['new_leader_email' => ['required', 'email']]);

        $newLeader = \App\Models\User::where('email', $validated['new_leader_email'])->first();
        if ($newLeader === null) {
            return back()->withErrors(['new_leader_email' => 'No account found with that email — the new lead must have an account first.']);
        }
        if ($newLeader->id === $dpreqApplication->applicant_id) {
            return back()->withErrors(['new_leader_email' => 'That person is already the current lead.']);
        }

        $this->researchApplications->transferOwnership($dpreqApplication->researchApplication, $newLeader, $request->user());

        return back()->with('success', "Ownership transferred to {$newLeader->name}. Their account is now the lead; the previous lead was deactivated.");
    }

    public function signNda(Request $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        $validated = $request->validate([
            'typed_full_name' => ['required', 'string'],
            'signature_image' => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:200000'],
            // Form 2 gate — the signer must explicitly accept the eight "OBLIGATIONS OF THE
            // RESEARCHER/S" items rendered above the signature block before signing.
            'obligations_accepted' => ['accepted'],
        ]);

        $signatory = $dpreqApplication->researchApplication->researchTeamNda->signatories()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        try {
            $this->researchTeamNda->sign($signatory, $validated['typed_full_name'], $validated['signature_image'] ?? null);
        } catch (RuntimeException $e) {
            return back()->withErrors(['nda' => $e->getMessage()]);
        }

        return back()->with('success', 'NDA signed.');
    }

    // stakeholder-additional-features.md (2026-07-25) — the lead researcher manages co-members and
    // triggers their unique emailed signing links. Only the application's own applicant (the team
    // leader) may manage members.
    public function addNdaMember(Request $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorizeTeamLeader($request, $dpreqApplication);

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
        ]);

        $nda = $dpreqApplication->researchApplication->researchTeamNda;

        try {
            $this->researchTeamNda->addMember($nda, $validated['full_name'], $validated['email']);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['full_name' => $e->getMessage()]);
        }

        return back()->with('success', "Signing invitation sent to {$validated['email']}.");
    }

    public function resendNdaInvitation(Request $request, DpreqApplication $dpreqApplication, ResearchTeamNdaSignatory $signatory): RedirectResponse
    {
        $this->authorizeTeamLeader($request, $dpreqApplication);
        $this->assertSignatoryBelongs($dpreqApplication, $signatory);

        try {
            $this->researchTeamNda->resendInvitation($signatory);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['members' => $e->getMessage()]);
        }

        return back()->with('success', "Signing invitation resent to {$signatory->email}.");
    }

    public function removeNdaMember(Request $request, DpreqApplication $dpreqApplication, ResearchTeamNdaSignatory $signatory): RedirectResponse
    {
        $this->authorizeTeamLeader($request, $dpreqApplication);
        $this->assertSignatoryBelongs($dpreqApplication, $signatory);

        if ($signatory->hasSigned() || $signatory->role === 'leader') {
            return back()->withErrors(['members' => 'You can only remove co-members who have not yet signed.']);
        }

        $signatory->delete();

        return back()->with('success', 'Member removed.');
    }

    private function authorizeTeamLeader(Request $request, DpreqApplication $dpreqApplication): void
    {
        abort_unless($dpreqApplication->applicant_id === $request->user()->id, 403, 'Only the research team leader can manage members.');
    }

    private function assertSignatoryBelongs(DpreqApplication $dpreqApplication, ResearchTeamNdaSignatory $signatory): void
    {
        abort_unless(
            $signatory->research_team_nda_id === $dpreqApplication->researchApplication->researchTeamNda->id,
            404,
        );
    }

    public function downloadFormPdf(DpreqApplication $dpreqApplication): StreamedResponse
    {
        $this->authorize('view', $dpreqApplication);

        $document = $dpreqApplication->documents()
            ->where('document_type', 'Form1Application')
            ->where('is_current_version', true)
            ->latest()
            ->first();

        // Fall back to synchronous generation if the queued job hasn't run yet (or predates
        // this feature) — a missing Form 1 PDF should still be downloadable on demand.
        if (!$document) {
            GenerateDpreqFormPdfJob::dispatchSync($dpreqApplication->id, auth()->id());

            $document = $dpreqApplication->documents()
                ->where('document_type', 'Form1Application')
                ->where('is_current_version', true)
                ->latest()
                ->firstOrFail();
        }

        return Storage::disk('documents')->download($document->file_path, $document->original_filename);
    }

    public function downloadNdaPdf(DpreqApplication $dpreqApplication): StreamedResponse
    {
        $this->authorize('view', $dpreqApplication);

        $document = $dpreqApplication->researchApplication->researchTeamNda
            ->documents()
            ->where('is_current_version', true)
            ->latest()
            ->firstOrFail();

        return Storage::disk('documents')->download($document->file_path, $document->original_filename);
    }

    public function downloadClearancePdf(DpreqApplication $dpreqApplication): StreamedResponse
    {
        $this->authorize('view', $dpreqApplication);

        $certificate = $dpreqApplication->researchApplication->clearanceCertificate;

        if (!$certificate || !$certificate->isDpreqIssued()) {
            abort(404, 'DPO clearance not yet issued.');
        }

        $document = $certificate->dpreqPdfDocument;

        return Storage::disk('documents')->download($document->file_path, $document->original_filename);
    }
}
