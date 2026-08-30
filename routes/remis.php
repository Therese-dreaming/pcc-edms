<?php

use App\Modules\Remis\Http\Controllers\RemisApplicationController;
use Illuminate\Support\Facades\Route;

// docs/3.1-3.5 — the Ethics track. Policy-gated in the controller.
Route::middleware(['auth', 'verified'])->prefix('remis')->name('remis.')->group(function () {
    Route::get('/', [RemisApplicationController::class, 'index'])->name('index');

    // Register bulk actions (index Actions menu). Authorized per-record in the controller.
    Route::post('/bulk-archive', [RemisApplicationController::class, 'bulkArchive'])->name('bulk-archive');
    Route::delete('/bulk-destroy', [RemisApplicationController::class, 'bulkDestroy'])->name('bulk-destroy');

    Route::get('/{remisApplication}', [RemisApplicationController::class, 'show'])->name('show');

    Route::post('/{remisApplication}/endorse', [RemisApplicationController::class, 'endorse'])->name('endorse');
    Route::post('/{remisApplication}/resubmit', [RemisApplicationController::class, 'resubmit'])->name('resubmit');
    Route::post('/{remisApplication}/amend', [RemisApplicationController::class, 'amend'])->name('amend');
    Route::post('/{remisApplication}/screen', [RemisApplicationController::class, 'screen'])->name('screen');
    Route::post('/{remisApplication}/assign-reviewer', [RemisApplicationController::class, 'assignReviewer'])->name('assign-reviewer');
    Route::post('/{remisApplication}/submit-review', [RemisApplicationController::class, 'submitReview'])->name('submit-review');
    Route::post('/{remisApplication}/decide', [RemisApplicationController::class, 'decide'])->name('decide');
    Route::post('/{remisApplication}/reactivate', [RemisApplicationController::class, 'reactivate'])->name('reactivate');
    Route::get('/{remisApplication}/clearance-pdf', [RemisApplicationController::class, 'downloadClearancePdf'])->name('clearance-pdf');

    // docs/3.4 — Monitoring & Completion
    Route::post('/{remisApplication}/progress-reports', [RemisApplicationController::class, 'submitProgressReport'])->name('progress-reports.store');
    Route::post('/progress-reports/{progressReport}/review', [RemisApplicationController::class, 'reviewProgressReport'])->name('progress-reports.review');
    Route::post('/{remisApplication}/completion-report', [RemisApplicationController::class, 'submitCompletionReport'])->name('completion-report.store');
    // Incident auto-pause exit (docs/HANDOFF.md Part L): the researcher resumes monitoring.
    Route::post('/{remisApplication}/resume-monitoring', [RemisApplicationController::class, 'resumeMonitoring'])->name('resume-monitoring');
});
