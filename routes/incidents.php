<?php

use App\Modules\Remis\Incident\Http\Controllers\IncidentController;
use Illuminate\Support\Facades\Route;

// docs/3.5-remis-incident-reporting.md
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/incidents', [IncidentController::class, 'index'])->name('incidents.index');
    Route::get('/remis/{remisApplication}/incidents/create', [IncidentController::class, 'create'])->name('incidents.create');
    Route::post('/remis/{remisApplication}/incidents', [IncidentController::class, 'store'])->name('incidents.store');
    Route::get('/incidents/{incident}', [IncidentController::class, 'show'])->name('incidents.show');
    Route::post('/incidents/{incident}/assign', [IncidentController::class, 'assign'])->name('incidents.assign');
    Route::post('/incidents/{incident}/note', [IncidentController::class, 'addNote'])->name('incidents.note');
    Route::post('/incidents/{incident}/transition', [IncidentController::class, 'transition'])->name('incidents.transition');
    Route::post('/incidents/{incident}/corrective-action', [IncidentController::class, 'setCorrectiveAction'])->name('incidents.corrective-action');
    Route::post('/incidents/{incident}/corrective-action/complete', [IncidentController::class, 'completeCorrectiveAction'])->name('incidents.corrective-action.complete');
    Route::post('/incidents/{incident}/corrective-action/verify', [IncidentController::class, 'verifyCorrectiveAction'])->name('incidents.corrective-action.verify');
});
