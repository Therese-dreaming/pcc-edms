<?php

namespace App\Shared\Documents\Services;

use App\Shared\Documents\Models\Document;
use App\Shared\Documents\Support\DocumentNaming;
use Illuminate\Support\Collection;

// File Management System (DPO / System Administrator) — a File-Explorer-style browser over the
// polymorphic `documents` table. There are NO real folders on disk; the tree is derived on the fly
// from document metadata so it can never drift from the actual stored files.
//
// Tree shape (breadcrumb path segments, "/"-joined, passed as the ?path query param):
//
//   (root)                       modules
//     └── {module}               departments  (JHS / SHS / COLLEGE / GS / …) — "who the applicant is"
//          └── {department}      applicants
//               └── {applicantId} applications (tracking numbers)
//                    └── {docId}  the two category folders
//                         ├── generated   system-produced forms (Form 1, NDA, notices)
//                         └── submitted   applicant uploads (proposal, consent, …)
//                              └── files
//
// The class hydrates each Document with lightweight, denormalized metadata (module, department,
// applicant name/type, tracking number, research title) up front, then slices that collection
// down at each level. For a system this size that's far simpler — and easier to keep correct —
// than five bespoke SQL group-bys, and the whole set is already scoped to DPO+admin viewers.
class FileManagerService
{
    // documentable_type morph class => the human module bucket shown as the top-level folders.
    private const MODULE_MAP = [
        \App\Modules\Dpreq\Models\DpreqApplication::class => 'DPREQ',
        \App\Modules\Dpreq\Models\ResearchTeamNda::class => 'DPREQ',
        \App\Modules\Dpnda\Models\DpndaRecord::class => 'DPNDA',
        \App\Modules\Remis\Models\RemisApplication::class => 'REMIS',
        \App\Modules\Remis\Incident\Models\Incident::class => 'REMIS',
    ];

    public const MODULES = ['DPREQ', 'DPNDA', 'REMIS'];

    public const CATEGORIES = [
        'generated' => 'Generated Documents',
        'submitted' => 'Submitted Files',
    ];

    /**
     * Resolve one level of the tree for the given breadcrumb path.
     *
     * @param  list<string>  $segments  Path segments after the root (e.g. ['DPREQ', 'COLLEGE']).
     * @return array{breadcrumbs: list<array{label: string, path: string}>, folders: list<array<string, mixed>>, files: list<array<string, mixed>>, level: string}
     */
    public function browse(array $segments, ?string $search = null): array
    {
        $rows = $this->hydrate($search);

        $breadcrumbs = $this->breadcrumbs($segments, $rows);

        // A search with no path browses the flat matching file list across everything.
        if (($search ?? '') !== '' && count($segments) === 0) {
            return [
                'level' => 'search',
                'breadcrumbs' => $breadcrumbs,
                'folders' => [],
                'files' => $this->files($rows),
            ];
        }

        return match (count($segments)) {
            0 => $this->moduleLevel($rows, $breadcrumbs),
            1 => $this->departmentLevel($rows, $segments, $breadcrumbs),
            2 => $this->applicantLevel($rows, $segments, $breadcrumbs),
            3 => $this->applicationLevel($rows, $segments, $breadcrumbs),
            4 => $this->categoryLevel($rows, $segments, $breadcrumbs),
            default => $this->fileLevel($rows, $segments, $breadcrumbs),
        };
    }

    // ---- Levels ---------------------------------------------------------------------------

    private function moduleLevel(Collection $rows, array $breadcrumbs): array
    {
        $folders = collect(self::MODULES)
            ->map(function (string $module) use ($rows) {
                $count = $rows->where('module', $module)->count();

                return [
                    'type' => 'folder',
                    'kind' => 'module',
                    'name' => $module,
                    'path' => $module,
                    'count' => $count,
                    'meta' => $count === 1 ? '1 file' : "{$count} files",
                ];
            })
            ->filter(fn($f) => $f['count'] > 0)
            ->values()
            ->all();

        return ['level' => 'module', 'breadcrumbs' => $breadcrumbs, 'folders' => $folders, 'files' => []];
    }

    private function departmentLevel(Collection $rows, array $segments, array $breadcrumbs): array
    {
        [$module] = $segments;
        $scoped = $rows->where('module', $module);

        $folders = $scoped
            ->groupBy('department')
            ->map(function (Collection $group, string $department) use ($module) {
                return [
                    'type' => 'folder',
                    'kind' => 'department',
                    'name' => $department,
                    'path' => "{$module}/{$department}",
                    'count' => $group->count(),
                    'meta' => $this->pluralize($group->pluck('applicant_id')->unique()->count(), 'applicant'),
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();

        return ['level' => 'department', 'breadcrumbs' => $breadcrumbs, 'folders' => $folders, 'files' => []];
    }

    private function applicantLevel(Collection $rows, array $segments, array $breadcrumbs): array
    {
        [$module, $department] = $segments;
        $scoped = $rows->where('module', $module)->where('department', $department);

        $folders = $scoped
            ->groupBy('applicant_id')
            ->map(function (Collection $group) use ($module, $department) {
                $first = $group->first();

                return [
                    'type' => 'folder',
                    'kind' => 'applicant',
                    'name' => $first['applicant_name'],
                    'subtitle' => $first['applicant_type'],
                    'path' => "{$module}/{$department}/{$first['applicant_id']}",
                    'count' => $group->count(),
                    'meta' => $this->pluralize($group->pluck('record_key')->unique()->count(), 'application'),
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();

        return ['level' => 'applicant', 'breadcrumbs' => $breadcrumbs, 'folders' => $folders, 'files' => []];
    }

    private function applicationLevel(Collection $rows, array $segments, array $breadcrumbs): array
    {
        [$module, $department, $applicantId] = $segments;
        $scoped = $rows->where('module', $module)
            ->where('department', $department)
            ->where('applicant_id', (int) $applicantId);

        $folders = $scoped
            ->groupBy('record_key')
            ->map(function (Collection $group) use ($module, $department, $applicantId) {
                $first = $group->first();

                return [
                    'type' => 'folder',
                    'kind' => 'application',
                    'name' => $first['tracking_number'],
                    'subtitle' => $first['research_title'],
                    'path' => "{$module}/{$department}/{$applicantId}/{$first['record_key']}",
                    'count' => $group->count(),
                    'meta' => $this->pluralize($group->count(), 'file'),
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();

        return ['level' => 'application', 'breadcrumbs' => $breadcrumbs, 'folders' => $folders, 'files' => []];
    }

    private function categoryLevel(Collection $rows, array $segments, array $breadcrumbs): array
    {
        [$module, $department, $applicantId, $recordKey] = $segments;
        $scoped = $this->scopeToRecord($rows, $module, $department, $applicantId, $recordKey);

        $folders = collect(self::CATEGORIES)
            ->map(function (string $label, string $source) use ($scoped, $module, $department, $applicantId, $recordKey) {
                $count = $scoped->where('source', $source)->count();

                return [
                    'type' => 'folder',
                    'kind' => 'category',
                    'name' => $label,
                    'category' => $source,
                    'path' => "{$module}/{$department}/{$applicantId}/{$recordKey}/{$source}",
                    'count' => $count,
                    'meta' => $this->pluralize($count, 'file'),
                ];
            })
            ->values()
            ->all();

        return ['level' => 'category', 'breadcrumbs' => $breadcrumbs, 'folders' => $folders, 'files' => []];
    }

    private function fileLevel(Collection $rows, array $segments, array $breadcrumbs): array
    {
        [$module, $department, $applicantId, $recordKey, $source] = $segments;
        $scoped = $this->scopeToRecord($rows, $module, $department, $applicantId, $recordKey)
            ->where('source', $source);

        return ['level' => 'file', 'breadcrumbs' => $breadcrumbs, 'folders' => [], 'files' => $this->files($scoped)];
    }

    // ---- Helpers --------------------------------------------------------------------------

    private function scopeToRecord(Collection $rows, string $module, string $department, string $applicantId, string $recordKey): Collection
    {
        return $rows->where('module', $module)
            ->where('department', $department)
            ->where('applicant_id', (int) $applicantId)
            ->where('record_key', $recordKey);
    }

    /** Shape a collection of hydrated rows into the file DTOs the frontend renders. */
    private function files(Collection $rows): array
    {
        return $rows
            ->sortByDesc('created_at')
            ->map(fn(array $row) => [
                'type' => 'file',
                'id' => $row['id'],
                'name' => $row['stored_filename'],
                'original_filename' => $row['original_filename'],
                'document_type' => $row['document_type'],
                'mime_type' => $row['mime_type'],
                'size_bytes' => $row['size_bytes'],
                'version' => $row['version'],
                'is_current_version' => $row['is_current_version'],
                'status' => $row['status'],
                'source' => $row['source'],
                'module' => $row['module'],
                'tracking_number' => $row['tracking_number'],
                'applicant_name' => $row['applicant_name'],
                'uploaded_by' => $row['uploaded_by'],
                'created_at' => $row['created_at'],
            ])
            ->values()
            ->all();
    }

    private function breadcrumbs(array $segments, Collection $rows): array
    {
        $crumbs = [['label' => 'File Manager', 'path' => '']];
        $accumulated = [];

        foreach ($segments as $index => $segment) {
            $accumulated[] = $segment;
            $crumbs[] = [
                'label' => $this->segmentLabel($index, $segment, $rows, $segments),
                'path' => implode('/', $accumulated),
            ];
        }

        return $crumbs;
    }

    // Turn a raw path segment into a human breadcrumb label (applicant id -> name, category key ->
    // "Generated Documents", everything else is already human-readable).
    private function segmentLabel(int $index, string $segment, Collection $rows, array $segments): string
    {
        return match ($index) {
            2 => $rows->firstWhere('applicant_id', (int) $segment)['applicant_name'] ?? "Applicant #{$segment}",
            4 => self::CATEGORIES[$segment] ?? $segment,
            default => $segment,
        };
    }

    private function pluralize(int $count, string $noun): string
    {
        return $count === 1 ? "1 {$noun}" : "{$count} {$noun}s";
    }

    /**
     * Load every current-and-historical document and denormalize the metadata each tree level
     * needs. Eager-loads the polymorphic parent + uploader so no N+1 fires while grouping.
     */
    private function hydrate(?string $search): Collection
    {
        $query = Document::query()
            ->with(['uploadedBy:id,name', 'documentable'])
            ->orderByDesc('created_at');

        if (($search ?? '') !== '') {
            $like = '%' . $search . '%';
            $query->where(fn($q) => $q->where('original_filename', 'like', $like)
                ->orWhere('file_path', 'like', $like)
                ->orWhere('document_type', 'like', $like));
        }

        return $query->get()->map(function (Document $doc) {
            $meta = $this->documentableMeta($doc);

            return [
                'id' => $doc->id,
                'source' => $doc->source ?? 'submitted',
                'document_type' => $doc->document_type,
                'stored_filename' => basename($doc->file_path),
                'original_filename' => $doc->original_filename,
                'mime_type' => $doc->mime_type,
                'size_bytes' => $doc->size_bytes,
                'version' => $doc->version,
                'is_current_version' => $doc->is_current_version,
                'status' => $doc->status,
                'uploaded_by' => $doc->uploadedBy?->name,
                'created_at' => $doc->created_at?->toIso8601String(),
                'record_key' => (string) $doc->documentable_id,
                ...$meta,
            ];
        });
    }

    /**
     * Denormalize the parent record: which module it belongs to, the applicant's identity
     * ("who the applicant is"), the normalized department bucket, tracking number and title.
     * A missing/soft-deleted parent falls back to sensible "Unknown" buckets so an orphan file is
     * still browsable rather than silently vanishing.
     *
     * @return array{module: string, department: string, applicant_id: int, applicant_name: string, applicant_type: string, tracking_number: string, research_title: ?string}
     */
    private function documentableMeta(Document $doc): array
    {
        $module = self::MODULE_MAP[$doc->documentable_type] ?? 'OTHER';
        $parent = $doc->documentable;

        $default = [
            'module' => $module,
            'department' => 'NA',
            'applicant_id' => 0,
            'applicant_name' => 'Unknown applicant',
            'applicant_type' => '',
            'tracking_number' => basename($doc->file_path),
            'research_title' => null,
        ];

        if ($parent === null) {
            return $default;
        }

        // The two research-application-backed tracks (DPREQ application, REMIS application) and the
        // DPREQ team NDA all reach the applicant + department + title via the shared research record.
        $research = match (true) {
            $parent instanceof \App\Modules\Dpreq\Models\DpreqApplication,
            $parent instanceof \App\Modules\Remis\Models\RemisApplication => $parent->researchApplication,
            $parent instanceof \App\Modules\Dpreq\Models\ResearchTeamNda => $parent->researchApplication,
            default => null,
        };

        if ($research !== null) {
            $applicant = $research->applicant;

            return [
                'module' => $module,
                'department' => DocumentNaming::department($research->department),
                'applicant_id' => (int) ($research->applicant_id ?? 0),
                'applicant_name' => $applicant?->name ?? 'Unknown applicant',
                'applicant_type' => $applicant ? $this->roleLabel($applicant->role?->name) : '',
                'tracking_number' => $parent->tracking_number ?? $default['tracking_number'],
                'research_title' => $research->research_title,
            ];
        }

        // DPNDA — an OJT/trainee placement, no research application; the trainee IS the applicant.
        if ($parent instanceof \App\Modules\Dpnda\Models\DpndaRecord) {
            $placement = $parent->placement;

            return [
                'module' => $module,
                'department' => DocumentNaming::department($placement?->department),
                'applicant_id' => (int) ($placement?->trainee_id ?? 0),
                'applicant_name' => $placement?->traineeFullName() ?: 'Unknown trainee',
                'applicant_type' => 'OJT / Trainee',
                'tracking_number' => $parent->tracking_number ?? $default['tracking_number'],
                'research_title' => null,
            ];
        }

        // REMIS incident — hangs off a REMIS application; reuse that application's applicant.
        if ($parent instanceof \App\Modules\Remis\Incident\Models\Incident) {
            $research = $parent->remisApplication?->researchApplication;
            $applicant = $research?->applicant;

            return [
                'module' => $module,
                'department' => DocumentNaming::department($research?->department),
                'applicant_id' => (int) ($research?->applicant_id ?? 0),
                'applicant_name' => $applicant?->name ?? 'Unknown applicant',
                'applicant_type' => 'Incident report',
                'tracking_number' => $parent->remisApplication?->tracking_number ?? $default['tracking_number'],
                'research_title' => $research?->research_title,
            ];
        }

        return $default;
    }

    private function roleLabel(?string $roleName): string
    {
        return match ($roleName) {
            'researcher_external' => 'External researcher',
            'researcher_internal', 'researcher' => 'Internal researcher',
            null => '',
            default => ucwords(str_replace('_', ' ', $roleName)),
        };
    }
}
