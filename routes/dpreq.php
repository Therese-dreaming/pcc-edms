<?php

use App\Modules\Dpreq\Http\Controllers\DpreqApplicationController;
use Illuminate\Support\Facades\Route;

// docs/1.1-1.3, docs/1.2-dpreq-workflow.md — the DPO track. Policy-gated in the controller
// (docs/0.2's capability matrix), not just by route middleware.
Route::middleware(['auth', 'verified'])->prefix('dpreq')->name('dpreq.')->group(function () {
    Route::get('/', [DpreqApplicationController::class, 'index'])->name('index');
    Route::get('/create', [DpreqApplicationController::class, 'create'])->name('create');
    Route::post('/', [DpreqApplicationController::class, 'store'])->name('store');
    Route::get('/{dpreqApplication}', [DpreqApplicationController::class, 'show'])->name('show');

    Route::post('/{dpreqApplication}/start-screening', [DpreqApplicationController::class, 'startScreening'])->name('start-screening');
    Route::post('/{dpreqApplication}/return', [DpreqApplicationController::class, 'returnForCorrection'])->name('return');
    Route::post('/{dpreqApplication}/resubmit', [DpreqApplicationController::class, 'resubmit'])->name('resubmit');
    Route::post('/{dpreqApplication}/pass-screening', [DpreqApplicationController::class, 'passScreening'])->name('pass-screening');
    Route::post('/{dpreqApplication}/endorse', [DpreqApplicationController::class, 'endorse'])->name('endorse');
    Route::post('/{dpreqApplication}/approve', [DpreqApplicationController::class, 'approve'])->name('approve');
    Route::post('/{dpreqApplication}/reject', [DpreqApplicationController::class, 'reject'])->name('reject');
    Route::post('/{dpreqApplication}/sign-nda', [DpreqApplicationController::class, 'signNda'])->name('sign-nda');
    Route::get('/{dpreqApplication}/nda-pdf', [DpreqApplicationController::class, 'downloadNdaPdf'])->name('nda-pdf');
    Route::get('/{dpreqApplication}/clearance-pdf', [DpreqApplicationController::class, 'downloadClearancePdf'])->name('clearance-pdf');
});
