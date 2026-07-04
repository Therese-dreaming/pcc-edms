<?php

use App\Shared\Verification\Http\Controllers\VerificationController;
use Illuminate\Support\Facades\Route;

// docs/3.1, docs/1.1 — public, unauthenticated verification portal. Rate-limited per
// docs/testing-strategy.md's explicit gap callout ("no auth to fall back on").
Route::middleware('throttle:20,1')->group(function () {
    Route::get('/verify', [VerificationController::class, 'show'])->name('verify');
    Route::get('/verify/{token}', [VerificationController::class, 'show'])->name('verify.token');
});
