<?php

namespace App\Shared\Revisions\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Documents\Services\DocumentService;
use App\Shared\Documents\Support\FileLabel;
use App\Shared\Documents\Support\UploadRules;
use App\Modules\Dpreq\Services\DpreqWorkflowService;
use App\Shared\Revisions\Models\RevisionRequest;
use App\Shared\Revisions\Services\RevisionService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use RuntimeException;

// FRS §IX — the shared HTTP surface for revision requests, serving BOTH application tracks. Staff
// (REMIS: secretariat/reviewer/chair; DPO: dpo_staff) raise and resolve; the applicant responds.
// The requestable is resolved from a track+id pair, the same allow-listed pattern as
// DocumentVersionController.
class RevisionController extends Controller
{
    private const MODELS = [
        'dpreq' => DpreqApplication::class,
        'remis' => RemisApplication::class,
    ];

    // Roles allowed to raise/resolve requests against each track.
    private const STAFF = [
        'dpreq' => ['dpo_staff', 'system_administrator'],
        'remis' => ['ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair', 'system_administrator'],
    ];

    public function __construct(
        private readonly RevisionService $revisions,
        private readonly DocumentService $documents,
        private readonly DpreqWorkflowService $dpreqWorkflow,
    ) {
    }

    public function raise(Request $request, string $track, int $id): RedirectResponse
    {
        $requestable = $this->resolveRequestable($track, $id);
        $this->assertStaff($request, $track);

        // DPREQ revisions are only meaningful once the application is under review — a mandatory
        // one returns it for editing, which isn't a legal transition before "Start Review". Mirror
        // the show-page gate (canRaise) server-side so a direct POST can't bypass it.
        if ($track === 'dpreq' && $requestable->status !== 'under_review') {
            return back()->withErrors(['item' => 'This application is not under review yet — click "Start Review" first, then you can request revisions.']);
        }

        $data = $request->validate([
            'item' => ['required', 'string', 'max:2000'],
            'kind' => ['required', 'in:comment,document_required'],
            'is_mandatory' => ['boolean'],
            'due_date' => ['nullable', 'date'],
        ]);

        $mandatory = $request->boolean('is_mandatory', true);

        // 2026-09 revision→edit fix: a MANDATORY `comment` request on the DPREQ track sends the
        // application back to the applicant (`returned`) so they can edit the Form-1 inputs to
        // comply — the update regenerates the Form 1 PDF as a new version. A `document_required`
        // request does NOT return the app: the applicant uploads the file from the revision panel
        // regardless of status, and the outstanding-mandatory gate already blocks approval until it
        // arrives — so the app stays `under_review` and only approval is held. Optional requests
        // (either kind) and all REMIS requests leave the status untouched.
        //
        // The 'returned' transition already notifies the applicant with the item as the reason, so
        // the revision's own applicant notification is skipped in that case to avoid a duplicate.
        $returnsToApplicant =
            $mandatory
            && $data['kind'] === 'comment'
            && $requestable instanceof DpreqApplication
            && $requestable->canTransitionTo('returned');

        $this->revisions->raise(
            $requestable,
            $request->user(),
            $data['item'],
            $requestable->applicant,
            $data['kind'],
            $mandatory,
            $data['due_date'] ?? null,
            notifyApplicant: ! $returnsToApplicant,
        );

        if ($returnsToApplicant) {
            $this->dpreqWorkflow->returnForCorrection($requestable, $data['item']);
        }

        return back()->with('success', $returnsToApplicant
            ? 'Revision request sent and the application was returned to the applicant for correction.'
            : 'Revision request sent to the applicant.');
    }

    public function respond(Request $request, RevisionRequest $revisionRequest): RedirectResponse
    {
        $requestable = $revisionRequest->requestable;
        abort_unless($requestable->applicant_id === $request->user()->id, 403, 'Only the applicant can respond.');

        $request->validate([
            'response' => ['nullable', 'string', 'max:2000'],
            'file' => UploadRules::rules(required: false),
        ]);

        $document = null;
        if ($request->hasFile('file')) {
            [$prefix, $path] = $this->documentContext($requestable);
            $document = $this->documents->store(
                $requestable,
                $request->file('file'),
                FileLabel::normalize($revisionRequest->item),
                $prefix,
                $requestable->tracking_number,
                $path,
                $requestable->researchApplication?->department,
            );
        }

        try {
            $this->revisions->respond($revisionRequest, $request->user(), $request->input('response'), $document);
        } catch (RuntimeException $e) {
            return back()->withErrors(['response' => $e->getMessage()]);
        }

        return back()->with('success', 'Response submitted.');
    }

    public function resolve(Request $request, RevisionRequest $revisionRequest): RedirectResponse
    {
        $this->assertStaff($request, $this->trackOf($revisionRequest->requestable));
        $this->revisions->resolve($revisionRequest, $request->user());

        return back()->with('success', 'Marked as resolved.');
    }

    public function waive(Request $request, RevisionRequest $revisionRequest): RedirectResponse
    {
        $this->assertStaff($request, $this->trackOf($revisionRequest->requestable));
        $this->revisions->waive($revisionRequest, $request->user());

        return back()->with('success', 'Request waived.');
    }

    private function resolveRequestable(string $track, int $id): Model
    {
        abort_unless(isset(self::MODELS[$track]), 404, 'Unknown application type.');

        return self::MODELS[$track]::findOrFail($id);
    }

    private function trackOf(Model $requestable): string
    {
        return $requestable instanceof DpreqApplication ? 'dpreq' : 'remis';
    }

    private function assertStaff(Request $request, string $track): void
    {
        abort_unless($request->user()->hasAnyRole(self::STAFF[$track]), 403, 'You are not permitted to manage revisions here.');
    }

    /** @return array{0: string, 1: string} module prefix + repository path for stored documents. */
    private function documentContext(Model $requestable): array
    {
        $year = $requestable->created_at->year;

        return $requestable instanceof DpreqApplication
            ? ['DPREQ', "DPO/DPREQ/{$year}/{$requestable->tracking_number}"]
            : ['REMIS', "ORD/REMIS/{$year}/{$requestable->tracking_number}"];
    }
}
