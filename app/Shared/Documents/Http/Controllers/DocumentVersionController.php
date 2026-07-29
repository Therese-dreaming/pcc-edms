<?php

namespace App\Shared\Documents\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\Documents\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

// docs/4.2-file-management-naming.md — document version history and restore.
// All module file writes go through DocumentService (which creates new versions),
// but this controller provides the read/restore UI for any version of any document.
class DocumentVersionController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLog,
    ) {}

    /**
     * Show version history for a documentable's documents of a given type.
     * The documentable is resolved via route-model-binding on the parent record
     * (e.g. DpreqApplication), and the document_type is passed as a query param.
     */
    public function index(Request $request, string $documentableType, int $documentableId): Response
    {
        $user = $request->user();
        $documentable = $this->resolveDocumentable($documentableType, $documentableId);

        // Authorization: must be able to view the parent record
        $this->authorize('view', $documentable);

        $documentType = $request->query('document_type');

        $documents = Document::where('documentable_type', $documentableType)
            ->where('documentable_id', $documentableId)
            ->when($documentType, fn ($q) => $q->where('document_type', $documentType))
            ->with('uploadedBy')
            ->orderBy('document_type')
            ->orderBy('version', 'desc')
            ->get();

        // Group by document_type for display
        $grouped = $documents->groupBy('document_type');

        return Inertia::render('Documents/VersionHistory', [
            'documentableType' => $documentableType,
            'documentableId' => $documentableId,
            'documentTypes' => $grouped->keys()->values(),
            'versions' => $grouped->map(fn ($group) => [
                'document_type' => $group->first()->document_type,
                'documents' => $group->map(fn ($doc) => [
                    'id' => $doc->id,
                    'version' => $doc->version,
                    'original_filename' => $doc->original_filename,
                    'file_path' => $doc->file_path,
                    'mime_type' => $doc->mime_type,
                    'size_bytes' => $doc->size_bytes,
                    'is_current_version' => $doc->is_current_version,
                    'uploaded_by' => $doc->uploadedBy?->name,
                    'created_at' => $doc->created_at->toIso8601String(),
                ])->values(),
            ])->values(),
        ]);
    }

    /**
     * Download any specific version of a document.
     */
    public function download(Request $request, Document $document): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('download', $document->documentable);

        return Storage::disk('documents')->download($document->file_path, $document->original_filename);
    }

    /**
     * Serve any specific version INLINE (not as an attachment) so it can render inside an iframe.
     * Powers the side-by-side version comparison view (stakeholder-additional-features.md,
     * "Versioned File Submission" — reviewers compare previous vs. current submission).
     */
    public function preview(Request $request, Document $document): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('download', $document->documentable);

        return Storage::disk('documents')->response($document->file_path, $document->original_filename, [
            'Content-Disposition' => 'inline; filename="' . $document->original_filename . '"',
        ]);
    }

    /**
     * Restore an older version as the current version (admin/DPO Staff only).
     */
    public function restore(Request $request, Document $document): RedirectResponse
    {
        $user = $request->user();

        // Only system_administrator and dpo_staff can restore versions
        if (! $user->hasAnyRole(['system_administrator', 'dpo_staff'])) {
            abort(403, 'Only administrators and DPO Staff can restore document versions.');
        }

        $this->authorize('view', $document->documentable);

        // Mark all versions of this document type as not current, then mark this one as current
        Document::where('documentable_type', $document->documentable_type)
            ->where('documentable_id', $document->documentable_id)
            ->where('document_type', $document->document_type)
            ->update(['is_current_version' => false]);

        $document->update(['is_current_version' => true]);

        $this->auditLog->record(
            'document.version_restored',
            $document,
            ['previous_current_version' => $document->version],
            ['restored_version' => $document->version, 'restored_by' => $user->id]
        );

        return back()->with('success', "Version {$document->version} of {$document->document_type} has been restored as the current version.");
    }

    /**
     * Resolve a documentable model from type + ID.
     * Only allows known documentable types for security.
     */
    private function resolveDocumentable(string $type, int $id)
    {
        $allowedTypes = [
            'App\\Modules\\Dpreq\\Models\\DpreqApplication',
            'App\\Modules\\Dpnda\\Models\\DpndaRecord',
            'App\\Modules\\Remis\\Models\\RemisApplication',
            'App\\Modules\\Remis\\Incident\\Models\\Incident',
        ];

        if (! in_array($type, $allowedTypes, true)) {
            abort(404, 'Unknown documentable type.');
        }

        return $type::findOrFail($id);
    }
}
