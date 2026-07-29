<?php

use App\Shared\Documents\Http\Controllers\DocumentVersionController;
use Illuminate\Support\Facades\Route;

// docs/4.2-file-management-naming.md — document version history, download any version,
// and restore an older version as current. Access is gated by the parent record's
// policy (authorize('view', $documentable)) plus role checks for restore.
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/documents/{documentableType}/{documentableId}/versions', [DocumentVersionController::class, 'index'])
        ->name('documents.versions.index');
    Route::get('/documents/{document}', [DocumentVersionController::class, 'download'])
        ->name('documents.download');
    Route::get('/documents/{document}/preview', [DocumentVersionController::class, 'preview'])
        ->name('documents.preview');
    Route::post('/documents/{document}/restore', [DocumentVersionController::class, 'restore'])
        ->name('documents.restore');
});
