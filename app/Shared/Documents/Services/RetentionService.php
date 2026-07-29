<?php

namespace App\Shared\Documents\Services;

use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

// stakeholder-additional-features.md (2026-07-25) — "Versioned File Submission" (archive superseded
// versions once clearance issues) and "Configurable file retention policies" / "Automatic archival
// after clearance issuance" from the Future Enhancements list.
//
// Two distinct operations, deliberately separated:
//   1. archiveSupersededVersions() — runs automatically at clearance issuance. Non-destructive:
//      flags older versions as archived so they stop competing with the approved submission, while
//      staying downloadable for audit.
//   2. eligibleForPurge()/purge() — the retention sweep (config/retention.php: 7 years issued,
//      3 years rejected). Destructive, so it is opt-in twice over (see the console command) and
//      only ever removes archived *files*, never the application record or its audit trail.
class RetentionService
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    /**
     * Flag every superseded (non-current) version attached to a record as archived. The current
     * version is always left alone — it is the approved submission.
     *
     * @return int number of versions archived
     */
    public function archiveSupersededVersions(Model $documentable): int
    {
        $superseded = Document::where('documentable_type', $documentable->getMorphClass())
            ->where('documentable_id', $documentable->getKey())
            ->where('is_current_version', false)
            ->whereNull('archived_at')
            ->get();

        if ($superseded->isEmpty()) {
            return 0;
        }

        Document::whereIn('id', $superseded->pluck('id'))->update(['archived_at' => now()]);

        $this->auditLog->record('document.versions_archived', $documentable, null, [
            'archived_document_ids' => $superseded->pluck('id')->all(),
            'count' => $superseded->count(),
        ]);

        return $superseded->count();
    }

    /**
     * Archive superseded versions across everything hanging off one research application, for the
     * track whose clearance just issued. Called from ClearanceService.
     *
     * @param  'dpo'|'ethics'  $track
     * @return int total versions archived
     */
    public function archiveForIssuedClearance(ResearchApplication $researchApplication, string $track): int
    {
        $records = $track === 'dpo'
            ? array_filter([
                $researchApplication->dpreqApplication,
                $researchApplication->researchTeamNda,
            ])
            : array_filter([
                $researchApplication->remisApplication,
            ]);

        $archived = 0;

        foreach ($records as $record) {
            $archived += $this->archiveSupersededVersions($record);
        }

        return $archived;
    }

    /**
     * Records whose retention window has elapsed, grouped by reason. Read-only — nothing is
     * modified here, so this is safe to call from a report or a dry run.
     *
     * @return array{issued: \Illuminate\Support\Collection, rejected: \Illuminate\Support\Collection}
     */
    public function eligibleForPurge(): array
    {
        $issuedCutoff = now()->subYears((int) config('retention.issued_years'));
        $rejectedCutoff = now()->subYears((int) config('retention.rejected_years'));

        // Issued: counted from the certificate's own issue date, per track.
        $issued = DpreqApplication::query()
            ->where('status', 'clearance_issued')
            ->whereHas('researchApplication.clearanceCertificate', fn ($q) => $q->where('dpreq_issued_at', '<', $issuedCutoff))
            ->with('researchApplication.clearanceCertificate')
            ->get()
            ->map(fn (DpreqApplication $a) => [
                'record' => $a,
                'label' => $a->tracking_number,
                'reason' => 'clearance issued ' . optional($a->researchApplication->clearanceCertificate->dpreq_issued_at)->toDateString(),
            ]);

        // Rejected/inactive: counted from the terminal transition (updated_at is when the record
        // last moved, which for a terminal status is that transition).
        $rejected = DpreqApplication::query()
            ->where('status', 'rejected')
            ->where('updated_at', '<', $rejectedCutoff)
            ->get()
            ->map(fn (DpreqApplication $a) => [
                'record' => $a,
                'label' => $a->tracking_number,
                'reason' => 'rejected ' . $a->updated_at->toDateString(),
            ])
            ->concat(
                RemisApplication::query()
                    ->whereIn('status', ['disapproved', 'archived'])
                    ->where('updated_at', '<', $rejectedCutoff)
                    ->get()
                    ->map(fn (RemisApplication $a) => [
                        'record' => $a,
                        'label' => $a->tracking_number,
                        'reason' => $a->status . ' ' . $a->updated_at->toDateString(),
                    ])
            );

        return ['issued' => $issued, 'rejected' => $rejected];
    }

    /**
     * Delete the stored FILES for a record's archived document versions, keeping the Document rows
     * (soft-deleted) and the record itself so the audit trail stays complete — RA 10173 requires
     * disposal of the personal data, not erasure of the evidence that it was processed and disposed.
     *
     * @return int number of files removed
     */
    public function purgeArchivedFiles(Model $documentable): int
    {
        $documents = Document::where('documentable_type', $documentable->getMorphClass())
            ->where('documentable_id', $documentable->getKey())
            ->whereNotNull('archived_at')
            ->get();

        $removed = 0;

        foreach ($documents as $document) {
            if (Storage::disk('documents')->exists($document->file_path)) {
                Storage::disk('documents')->delete($document->file_path);
                $removed++;
            }

            $document->delete(); // soft delete — the row remains as the disposal record
        }

        if ($removed > 0) {
            $this->auditLog->record('document.retention_purged', $documentable, null, [
                'files_removed' => $removed,
                'document_ids' => $documents->pluck('id')->all(),
            ]);
        }

        return $removed;
    }
}
