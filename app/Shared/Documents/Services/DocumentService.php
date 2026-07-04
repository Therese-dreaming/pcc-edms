<?php

namespace App\Shared\Documents\Services;

use App\Shared\Documents\Models\Document;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

// docs/4.2-file-management-naming.md — naming convention, repository placement, and versioning
// (re-uploads create a new version, old version retained, never overwritten). All module file
// writes go through here and Storage::disk('documents') (architecture.md ADR-004 action item),
// never raw filesystem calls.
class DocumentService
{
    /**
     * Store a user-uploaded file (e.g. research proposal, consent form).
     *
     * @param  string  $repositoryPath  e.g. "DPO/DPREQ/2026/DPREQ-2026-0001" per docs/4.2
     */
    public function store(
        Model $documentable,
        UploadedFile $file,
        string $documentType,
        string $modulePrefix,
        string $recordId,
        string $repositoryPath,
    ): Document {
        $filename = sprintf(
            '%s_%s_%s_%s.%s',
            $modulePrefix,
            $recordId,
            $documentType,
            now()->format('Ymd'),
            $file->getClientOriginalExtension(),
        );

        $storedPath = Storage::disk('documents')->putFileAs($repositoryPath, $file, $filename);

        return $this->createVersionedRecord(
            $documentable,
            $documentType,
            $storedPath,
            $file->getClientOriginalName(),
            $file->getMimeType(),
            $file->getSize(),
            Auth::id(),
        );
    }

    /**
     * Store a system-generated file (e.g. a Browsershot-rendered PDF) that has no
     * corresponding UploadedFile — the bytes already exist in memory.
     *
     * @param  string  $repositoryPath  e.g. "DPO/DPREQ/2026/DPREQ-2026-0001" per docs/4.2
     */
    public function storeGenerated(
        Model $documentable,
        string $bytes,
        string $extension,
        string $mimeType,
        string $documentType,
        string $modulePrefix,
        string $recordId,
        string $repositoryPath,
        int $generatedByUserId,
    ): Document {
        $filename = sprintf(
            '%s_%s_%s_%s.%s',
            $modulePrefix,
            $recordId,
            $documentType,
            now()->format('Ymd'),
            $extension,
        );

        $storedPath = $repositoryPath . '/' . $filename;
        Storage::disk('documents')->put($storedPath, $bytes);

        return $this->createVersionedRecord(
            $documentable,
            $documentType,
            $storedPath,
            $filename,
            $mimeType,
            strlen($bytes),
            $generatedByUserId,
        );
    }

    private function createVersionedRecord(
        Model $documentable,
        string $documentType,
        string $storedPath,
        string $originalFilename,
        string $mimeType,
        int $sizeBytes,
        int $uploadedBy,
    ): Document {
        $nextVersion = Document::where('documentable_type', $documentable->getMorphClass())
            ->where('documentable_id', $documentable->getKey())
            ->where('document_type', $documentType)
            ->max('version') + 1;

        Document::where('documentable_type', $documentable->getMorphClass())
            ->where('documentable_id', $documentable->getKey())
            ->where('document_type', $documentType)
            ->update(['is_current_version' => false]);

        return Document::create([
            'documentable_type' => $documentable->getMorphClass(),
            'documentable_id' => $documentable->getKey(),
            'document_type' => $documentType,
            'file_path' => $storedPath,
            'original_filename' => $originalFilename,
            'mime_type' => $mimeType,
            'size_bytes' => $sizeBytes,
            'version' => $nextVersion,
            'uploaded_by' => $uploadedBy,
            'is_current_version' => true,
        ]);
    }
}
