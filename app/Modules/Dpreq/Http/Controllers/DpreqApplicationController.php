<?php

namespace App\Modules\Dpreq\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Dpreq\Http\Requests\StoreDpreqApplicationRequest;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Dpreq\Services\DpreqWorkflowService;
use App\Modules\Dpreq\Services\ResearchTeamNdaService;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

// docs/1.1-1.3 (application), docs/1.2 (workflow) — the DPO track's Inertia controller.
class DpreqApplicationController extends Controller
{
    public function __construct(
        private readonly ResearchApplicationService $researchApplications,
        private readonly DpreqWorkflowService $workflow,
        private readonly ResearchTeamNdaService $researchTeamNda,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canSeeAll = $user->hasAnyRole(['dpo_staff', 'system_administrator']);

        $scope = function ($query) use ($user, $canSeeAll) {
            if (! $canSeeAll) {
                $query->where('applicant_id', $user->id);
            }
        };

        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status');

        $query = DpreqApplication::with('researchApplication')->latest();
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

        $countsQuery = DpreqApplication::query();
        $scope($countsQuery);

        return Inertia::render('Dpreq/Index', [
            'applications' => $query->paginate(5)->withQueryString(),
            'filters' => ['search' => $search, 'status' => $status ?: 'all'],
            'statusCounts' => $countsQuery->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', DpreqApplication::class);

        return Inertia::render('Dpreq/Create');
    }

    public function store(StoreDpreqApplicationRequest $request): RedirectResponse
    {
        $application = $this->researchApplications->submitForm1($request->validated(), $request->user());

        return redirect()->route('dpreq.show', $application)
            ->with('success', "Application {$application->tracking_number} submitted.");
    }

    public function show(DpreqApplication $dpreqApplication): Response
    {
        $this->authorize('view', $dpreqApplication);

        $dpreqApplication->load([
            'researchApplication.researchTeamNda.signatories',
            'researchApplication.researchTeamNda.documents',
            'statusHistory.changedBy',
            'applicant',
        ]);

        return Inertia::render('Dpreq/Show', [
            'application' => $dpreqApplication,
            'legalTransitions' => DpreqApplication::LEGAL_TRANSITIONS[$dpreqApplication->status] ?? [],
        ]);
    }

    public function startScreening(DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('screen', $dpreqApplication);
        $this->workflow->startScreening($dpreqApplication);

        return back()->with('success', 'Screening started.');
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
        $this->workflow->resubmit($dpreqApplication);

        return back()->with('success', 'Application resubmitted.');
    }

    public function passScreening(DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('screen', $dpreqApplication);
        $this->workflow->passScreeningToReview($dpreqApplication);

        return back()->with('success', 'Moved to Under Review.');
    }

    public function endorse(Request $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('endorse', $dpreqApplication);
        $validated = $request->validate(['comments' => ['nullable', 'string']]);
        $this->workflow->endorse($dpreqApplication, $validated['comments'] ?? null);

        return back()->with('success', 'Application endorsed for final approval.');
    }

    public function approve(Request $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('approve', $dpreqApplication);

        try {
            $this->workflow->approve($dpreqApplication, $request->user()->id);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['nda' => $e->getMessage()]);
        }

        return back()->with('success', 'Application approved.');
    }

    public function reject(Request $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        $this->authorize('reject', $dpreqApplication);
        $validated = $request->validate(['reason' => ['required', 'string']]);
        $this->workflow->reject($dpreqApplication, $validated['reason']);

        return back()->with('success', 'Application rejected.');
    }

    public function signNda(Request $request, DpreqApplication $dpreqApplication): RedirectResponse
    {
        $validated = $request->validate([
            'typed_full_name' => ['required', 'string'],
            'signature_image' => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:200000'],
        ]);

        $signatory = $dpreqApplication->researchApplication->researchTeamNda->signatories()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $this->researchTeamNda->sign($signatory, $validated['typed_full_name'], $validated['signature_image'] ?? null);

        return back()->with('success', 'NDA signed.');
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

        if (! $certificate || ! $certificate->isIssued()) {
            abort(404, 'Clearance not yet issued.');
        }

        $document = $certificate->pdfDocument;

        return Storage::disk('documents')->download($document->file_path, $document->original_filename);
    }
}
