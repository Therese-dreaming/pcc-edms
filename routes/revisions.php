<?php

use App\Shared\Revisions\Http\Controllers\RevisionController;
use Illuminate\Support\Facades\Route;

// FRS §IX Revision Management — shared across the DPO (dpreq) and Ethics (remis) tracks. Staff raise
// and resolve; the applicant responds. Authorization is enforced in the controller (role for staff
// actions, applicant ownership for responses), matching the pattern used elsewhere in this app.
Route::middleware(['auth', 'verified'])->prefix('revisions')->name('revisions.')->group(function () {
    // Action routes on an existing request come first, and the raise route's {track} is constrained
    // to the two known tracks, so "/revisions/5/respond" can never be read as raise(track=5).
    Route::post('/{revisionRequest}/respond', [RevisionController::class, 'respond'])->name('respond');
    Route::post('/{revisionRequest}/resolve', [RevisionController::class, 'resolve'])->name('resolve');
    Route::post('/{revisionRequest}/waive', [RevisionController::class, 'waive'])->name('waive');
    Route::post('/{track}/{id}', [RevisionController::class, 'raise'])
        ->whereIn('track', ['dpreq', 'remis'])->whereNumber('id')->name('raise');
});
