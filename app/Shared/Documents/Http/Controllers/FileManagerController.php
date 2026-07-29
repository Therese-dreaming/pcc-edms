<?php

namespace App\Shared\Documents\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Documents\Services\FileManagerService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// File Management System — a File-Explorer-style browser over all stored documents, for the DPO
// and System Administrator side only. Files are categorized into system-generated documents
// (forms) vs applicant-submitted files, organized by module -> department -> applicant ->
// application. Access is gated by an explicit role check (matching the UserPolicy/Reports pattern
// used elsewhere), not route middleware. Download/preview reuse the existing documents.* routes.
class FileManagerController extends Controller
{
    // Confirmed scope: the DPO desk (dpo_staff) and the system administrator. Every other role is
    // 403'd — applicants and reviewers reach their own files through the module screens instead.
    private const ALLOWED_ROLES = ['dpo_staff', 'system_administrator'];

    public function __construct(
        private readonly FileManagerService $fileManager,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->hasAnyRole(self::ALLOWED_ROLES)) {
            abort(403, 'The file manager is available to DPO staff and administrators only.');
        }

        $rawPath = trim((string) $request->query('path', ''), '/');
        $segments = $rawPath === '' ? [] : explode('/', $rawPath);
        $search = trim((string) $request->query('search', ''));

        $tree = $this->fileManager->browse($segments, $search === '' ? null : $search);

        return Inertia::render('Files/Index', [
            'path' => $rawPath,
            'search' => $search,
            'breadcrumbs' => $tree['breadcrumbs'],
            'folders' => $tree['folders'],
            'files' => $tree['files'],
            'level' => $tree['level'],
        ]);
    }
}
