<?php

use App\Shared\Onboarding\Http\Controllers\JoinController;
use Illuminate\Support\Facades\Route;

// PUBLIC cohort enrolment (stakeholder request, 2026-07-25) — a student enrols themselves using the
// join code their adviser shared, or accepts a personal invitation link. Unauthenticated by design:
// the account doesn't exist yet.
//
// This does NOT reopen the public self-registration removed earlier the same day — every route here
// requires an adviser-issued credential (a cohort join code or a single-use invitation token), and
// CohortService enforces expiry, headcount cap, email-domain restriction and revocation on top.
// Throttled like the other public surfaces (routes/verify.php, the NDA signing routes).
Route::middleware(['guest', 'throttle:20,1'])->group(function () {
    Route::get('/join/invitation/{token}', [JoinController::class, 'showInvitation'])->name('join.invitation');
    Route::post('/join/invitation/{token}', [JoinController::class, 'acceptInvitation'])->name('join.invitation.accept');

    // Declared after the more specific /join/invitation/... routes so "invitation" is never
    // swallowed as a join code.
    Route::get('/join/{code}', [JoinController::class, 'showCohort'])->name('join.cohort');
    Route::post('/join/{code}', [JoinController::class, 'join'])->name('join.cohort.store');
});
