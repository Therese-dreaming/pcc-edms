<?php

namespace App\Shared\Revisions\Services;

use App\Models\User;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\Documents\Models\Document;
use App\Shared\Notifications\Services\NotificationService;
use App\Shared\Revisions\Models\RevisionRequest;
use App\Shared\Revisions\Models\RevisionResponse;
use Illuminate\Database\Eloquent\Model;
use RuntimeException;

// FRS §IX Revision Management — the shared back-and-forth engine. A reviewer/DPO staff raises a
// request (a comment to address, or a document that must be supplied) against an application; the
// applicant responds with text and/or a revised document. Built once and reused by both REMIS
// (reviewer/secretariat) and DPO (item 7: "request additional requirements").
//
// The `requestable` is a RemisApplication or a DpreqApplication. The service takes the applicant to
// notify explicitly so it stays decoupled from either module's ownership rules.
class RevisionService
{
    public function __construct(
        private readonly AuditLogService $auditLog,
        private readonly NotificationService $notifications,
    ) {
    }

    /**
     * Raise a request against an application. `kind` = 'document_required' when a file must be
     * supplied, otherwise 'comment'. Mandatory requests block the application from advancing until
     * resolved (see hasOutstandingMandatory).
     */
    public function raise(
        Model $requestable,
        User $raisedBy,
        string $item,
        User $applicant,
        string $kind = 'comment',
        bool $mandatory = true,
        ?string $dueDate = null,
    ): RevisionRequest {
        $request = $requestable->revisionRequests()->create([
            'raised_by' => $raisedBy->id,
            'item' => $item,
            'kind' => $kind,
            'is_mandatory' => $mandatory,
            'due_date' => $dueDate,
            'status' => 'open',
        ]);

        $this->auditLog->record('revision_request.raised', $request, null, [
            'item' => $item, 'kind' => $kind, 'is_mandatory' => $mandatory,
        ]);

        $label = $kind === 'document_required' ? 'Additional document requested' : 'Revision requested';
        $this->notifications->notifyUser($applicant, $label, $item, $requestable);

        return $request;
    }

    /**
     * The applicant responds to a request — free text and/or a revised document. Moves the request
     * to 'responded' (a reviewer still resolves/waives it explicitly).
     */
    public function respond(RevisionRequest $request, User $applicant, ?string $text = null, ?Document $document = null): RevisionResponse
    {
        if (! $request->isOpen()) {
            throw new RuntimeException('This request is already closed.');
        }

        if ($text === null && $document === null) {
            throw new RuntimeException('A response needs either a message or a document.');
        }

        $response = $request->responses()->create([
            'response' => $text,
            'document_id' => $document?->id,
            'responded_by' => $applicant->id,
            'responded_at' => now(),
        ]);

        $request->update(['status' => 'responded']);

        $this->auditLog->record('revision_request.responded', $request, null, [
            'has_document' => $document !== null,
        ]);

        $this->notifications->notifyUser(
            $request->raisedBy,
            'Revision response submitted',
            "The applicant responded to: \"{$request->item}\"",
            $request->requestable,
        );

        return $response;
    }

    public function resolve(RevisionRequest $request, User $resolver): RevisionRequest
    {
        $request->update(['status' => 'resolved', 'resolved_by' => $resolver->id, 'resolved_at' => now()]);
        $this->auditLog->record('revision_request.resolved', $request, null, ['resolved_by' => $resolver->id]);

        return $request->fresh();
    }

    /** Waive a request that turned out not to be needed — closes it without requiring a response. */
    public function waive(RevisionRequest $request, User $resolver): RevisionRequest
    {
        $request->update(['status' => 'waived', 'resolved_by' => $resolver->id, 'resolved_at' => now()]);
        $this->auditLog->record('revision_request.waived', $request, null, ['resolved_by' => $resolver->id]);

        return $request->fresh();
    }

    /**
     * Whether any mandatory request is still open — the gate a workflow checks before letting an
     * application advance (resubmit / approve).
     */
    public function hasOutstandingMandatory(Model $requestable): bool
    {
        return $requestable->revisionRequests()
            ->where('is_mandatory', true)
            ->whereIn('status', ['open', 'responded'])
            ->exists();
    }
}
