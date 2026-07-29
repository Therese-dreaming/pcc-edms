<?php

use App\Modules\Dpreq\Http\Controllers\DpreqApplicationController;
use App\Modules\Dpreq\Http\Controllers\ResearchTeamNdaSigningController;
use Illuminate\Support\Facades\Route;

// stakeholder-additional-features.md (2026-07-25) — PUBLIC, token-gated per-member NDA signing.
// No auth: the 64-char token is the credential (single-use + expiring). Throttled against abuse.
Route::middleware('throttle:20,1')->group(function () {
    Route::get('/nda/sign/{token}', [ResearchTeamNdaSigningController::class, 'show'])->name('nda.sign');
    Route::post('/nda/sign/{token}', [ResearchTeamNdaSigningController::class, 'submit'])->name('nda.sign.submit');
});

// docs/1.1-1.3, docs/1.2-dpreq-workflow.md — the DPO track. Policy-gated in the controller
// (docs/0.2's capability matrix), not just by route middleware.
Route::middleware(['auth', 'verified'])->prefix('dpreq')->name('dpreq.')->group(function () {
    Route::get('/', [DpreqApplicationController::class, 'index'])->name('index');
    Route::get('/create', [DpreqApplicationController::class, 'create'])->name('create');
    Route::post('/', [DpreqApplicationController::class, 'store'])->name('store');

    // Register bulk actions (index Actions menu). Authorized per-record in the controller.
    Route::post('/bulk-archive', [DpreqApplicationController::class, 'bulkArchive'])->name('bulk-archive');
    Route::delete('/bulk-destroy', [DpreqApplicationController::class, 'bulkDestroy'])->name('bulk-destroy');
    Route::get('/{dpreqApplication}', [DpreqApplicationController::class, 'show'])->name('show');

    // Edit Form-1 fields (applicant, while draft/returned). Editing a Form-1 field regenerates the
    // Form 1 PDF as a new version (stakeholder 2026-07-28).
    Route::get('/{dpreqApplication}/edit', [DpreqApplicationController::class, 'edit'])->name('edit');
    Route::put('/{dpreqApplication}', [DpreqApplicationController::class, 'update'])->name('update');

    Route::post('/{dpreqApplication}/start-review', [DpreqApplicationController::class, 'startReview'])->name('start-review');
    Route::post('/{dpreqApplication}/return', [DpreqApplicationController::class, 'returnForCorrection'])->name('return');
    Route::post('/{dpreqApplication}/resubmit', [DpreqApplicationController::class, 'resubmit'])->name('resubmit');
    Route::post('/{dpreqApplication}/approve', [DpreqApplicationController::class, 'approve'])->name('approve');
    Route::post('/{dpreqApplication}/reject', [DpreqApplicationController::class, 'reject'])->name('reject');
    // B3 (concern 3.4) — admin reassigns a group's lead when the original leader leaves.
    Route::post('/{dpreqApplication}/transfer-ownership', [DpreqApplicationController::class, 'transferOwnership'])->name('transfer-ownership');
    Route::post('/{dpreqApplication}/sign-nda', [DpreqApplicationController::class, 'signNda'])->name('sign-nda');
    Route::post('/{dpreqApplication}/nda/members', [DpreqApplicationController::class, 'addNdaMember'])->name('nda.members.add');
    Route::post('/{dpreqApplication}/nda/members/{signatory}/resend', [DpreqApplicationController::class, 'resendNdaInvitation'])->name('nda.members.resend');
    Route::delete('/{dpreqApplication}/nda/members/{signatory}', [DpreqApplicationController::class, 'removeNdaMember'])->name('nda.members.remove');
    Route::get('/{dpreqApplication}/form-pdf', [DpreqApplicationController::class, 'downloadFormPdf'])->name('form-pdf');
    Route::get('/{dpreqApplication}/nda-pdf', [DpreqApplicationController::class, 'downloadNdaPdf'])->name('nda-pdf');
    Route::get('/{dpreqApplication}/clearance-pdf', [DpreqApplicationController::class, 'downloadClearancePdf'])->name('clearance-pdf');
});
