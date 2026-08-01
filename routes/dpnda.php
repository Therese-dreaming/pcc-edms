<?php

use App\Modules\Dpnda\Http\Controllers\DpndaCalendarController;
use App\Modules\Dpnda\Http\Controllers\DpndaRecordController;
use App\Modules\Dpnda\Http\Controllers\TraineeScheduleController;
use Illuminate\Support\Facades\Route;

// docs/2.1-2.2 — the OJT/Trainee NDA (Form 5) track. Policy-gated in the controller.
Route::middleware(['auth', 'verified'])->prefix('dpnda')->name('dpnda.')->group(function () {
    Route::get('/', [DpndaRecordController::class, 'index'])->name('index');
    Route::get('/create', [DpndaRecordController::class, 'create'])->name('create');
    Route::post('/', [DpndaRecordController::class, 'store'])->name('store');

    // Register bulk actions (index Actions menu). Authorized per-record in the controller.
    Route::post('/bulk-archive', [DpndaRecordController::class, 'bulkArchive'])->name('bulk-archive');
    Route::delete('/bulk-destroy', [DpndaRecordController::class, 'bulkDestroy'])->name('bulk-destroy');

    // Deployment calendar (whereabouts month view) and trainee self-service weekly schedule.
    // Registered BEFORE the {dpndaRecord} wildcard so "calendar"/"schedules" aren't captured as an id.
    Route::get('/calendar', [DpndaCalendarController::class, 'index'])->name('calendar');
    Route::get('/schedules', [TraineeScheduleController::class, 'index'])->name('schedules.index');
    Route::post('/schedules', [TraineeScheduleController::class, 'store'])->name('schedules.store');
    Route::put('/schedules/{schedule}', [TraineeScheduleController::class, 'update'])->name('schedules.update');
    Route::delete('/schedules/{schedule}', [TraineeScheduleController::class, 'destroy'])->name('schedules.destroy');

    Route::get('/{dpndaRecord}', [DpndaRecordController::class, 'show'])->name('show');

    Route::post('/{dpndaRecord}/send-for-signing', [DpndaRecordController::class, 'sendForSigning'])->name('send-for-signing');
    Route::post('/{dpndaRecord}/sign', [DpndaRecordController::class, 'sign'])->name('sign');
    Route::post('/{dpndaRecord}/decline', [DpndaRecordController::class, 'decline'])->name('decline');
    Route::post('/{dpndaRecord}/countersign', [DpndaRecordController::class, 'countersign'])->name('countersign');
    Route::get('/{dpndaRecord}/pdf', [DpndaRecordController::class, 'downloadPdf'])->name('pdf');
    Route::post('/{dpndaRecord}/evaluation-report', [DpndaRecordController::class, 'uploadEvaluationReport'])->name('evaluation-report.store');
});
