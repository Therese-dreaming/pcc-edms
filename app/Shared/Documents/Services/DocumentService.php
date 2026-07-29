<?php

namespace App\Shared\Documents\Services;

use App\Shared\Documents\Models\Document;
use App\Shared\Documents\Support\DocumentNaming;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

// docs/4.2-file-management-naming.md + stakeholder-additional-features.md ("Automatic File Naming
// Convention", 2026-07-25) — every stored file is renamed to
// REC-{MODULE}-{DEPARTMENT}-{CONTROLNO}_{YYYYMMDD}_{FILELABEL}_V{n}.{ext} (see DocumentNaming).
// Re-uploads create a new version (never overwritten, old versions retained); the version number
// is baked into the filename so each version is a distinct file on disk. All module file writes
// go through here and Storage::disk('documents') (architecture.md ADR-004), never raw filesystem
// calls. The original client filename is retained in documents.original_filename for reference
// only — it is never the stored filename.
class DocumentService
{
    /**
     * Store a user-uploaded file (e.g. research proposal, consent form).
     *
     * @param  string  $documentType    Used as the FILELABEL segment (see Support\FileLabel).
     * @param  string  $recordId        Tracking/control number — its trailing digits become CONTROLNO.
     * @param  string  $repositoryPath  e.g. "DPO/DPREQ/2026/DPREQ-2026-0001" per docs/4.2
     * @param  ?string $department      Applicant department, normalized to the DEPARTMENT segment.
     */
    public function store(
        Model $documentable,
        UploadedFile $file,
        string $documentType,
        string $modulePrefix,
        string $recordId,
        string $repositoryPath,
        ?string $department = null,
    ): Document {
        $version = $this->nextVersion($documentable, $documentType);

        $filename = DocumentNaming::filename(
            $modulePrefix,
            $department,
            $recordId,
            $documentType,
            $version,
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
            $version,
            'submitted',
        );
    }

    /**
     * Store a system-generated file (e.g. a Browsershot-rendered PDF) that has no
     * corresponding UploadedFile — the bytes already exist in memory.
     *
     * @param  string  $repositoryPath  e.g. "DPO/DPREQ/2026/DPREQ-2026-0001" per docs/4.2
     * @param  ?string $department      Applicant department, normalized to the DEPARTMENT segment.
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
        ?string $department = null,
    ): Document {
        $version = $this->nextVersion($documentable, $documentType);

        $filename = DocumentNaming::filename(
            $modulePrefix,
            $department,
            $recordId,
            $documentType,
            $version,
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
            $version,
            'generated',
        );
    }

    private function nextVersion(Model $documentable, string $documentType): int
    {
        return Document::where('documentable_type', $documentable->getMorphClass())
            ->where('documentable_id', $documentable->getKey())
            ->where('document_type', $documentType)
            ->max('version') + 1;
    }

    private function createVersionedRecord(
        Model $documentable,
        string $documentType,
        string $storedPath,
        string $originalFilename,
        string $mimeType,
        int $sizeBytes,
        int $uploadedBy,
        int $version,
        string $source = 'submitted',
    ): Document {
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
            'version' => $version,
            'uploaded_by' => $uploadedBy,
            'source' => $source,
            'is_current_version' => true,
        ]);
    }
}
