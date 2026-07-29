<?php

use App\Shared\AuditLog\Http\Controllers\AuditLogController;
use App\Shared\Auth\Http\Controllers\AdminUserController;
use App\Shared\Onboarding\Http\Controllers\AdviserAccountRequestController;
use App\Shared\Onboarding\Http\Controllers\CohortController;
use Illuminate\Support\Facades\Route;

// Adviser onboarding. The standalone one-applicant-at-a-time form was retired 2026-07-25 once
// cohorts landed — a cohort's manual "add member" already covers a single applicant, and admins keep
// full account creation at /admin/users. Gated by CohortPolicy in the controller, same
// controller-authorize pattern as the admin routes below.
Route::middleware(['auth', 'verified'])->prefix('adviser')->name('adviser.')->group(function () {
    // Class cohorts — the bulk-onboarding path (share one join code instead of typing 50 students).
    // Gated by CohortPolicy in the controller, same pattern as everything else here.
    Route::get('/cohorts', [CohortController::class, 'index'])->name('cohorts.index');
    Route::get('/cohorts/create', [CohortController::class, 'create'])->name('cohorts.create');
    Route::post('/cohorts', [CohortController::class, 'store'])->name('cohorts.store');
    // /edit before /{cohort} so "edit" is never captured as a cohort id.
    Route::get('/cohorts/{cohort}/edit', [CohortController::class, 'edit'])->name('cohorts.edit');
    Route::put('/cohorts/{cohort}', [CohortController::class, 'update'])->name('cohorts.update');
    Route::get('/cohorts/{cohort}', [CohortController::class, 'show'])->name('cohorts.show');
    Route::post('/cohorts/{cohort}/toggle-open', [CohortController::class, 'toggleOpen'])->name('cohorts.toggle-open');
    Route::post('/cohorts/{cohort}/regenerate-code', [CohortController::class, 'regenerateCode'])->name('cohorts.regenerate-code');
    Route::post('/cohorts/{cohort}/members', [CohortController::class, 'addMember'])->name('cohorts.members.add');
    Route::post('/cohorts/{cohort}/members/bulk', [CohortController::class, 'addMembersBulk'])->name('cohorts.members.bulk');
    Route::post('/cohorts/{cohort}/members/{member}/resend', [CohortController::class, 'resendInvitation'])->name('cohorts.members.resend');
    Route::delete('/cohorts/{cohort}/members/{member}', [CohortController::class, 'removeMember'])->name('cohorts.members.remove');
});

// docs/4.1-user-roles-permissions.md — user management, system_administrator only. Role checks
// happen via UserPolicy (authorize() calls in the controller), not route middleware, matching
// the pattern already used by the Reports module.
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::get('/users/create', [AdminUserController::class, 'create'])->name('users.create');
    Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
    // Bulk account-status change from the index Actions menu (activate / suspend / deactivate).
    Route::post('/users/bulk-status', [AdminUserController::class, 'bulkStatus'])->name('users.bulk-status');
    Route::get('/users/import', [AdminUserController::class, 'importForm'])->name('users.import');
    Route::post('/users/import/preview', [AdminUserController::class, 'preview'])->name('users.import.preview');
    Route::post('/users/import/confirm', [AdminUserController::class, 'confirmImport'])->name('users.import.confirm');
    Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');

    // External adviser account requests — reviewed by system_administrator + dpo_staff (gated in the
    // controller, matching the UserPolicy pattern above).
    Route::get('/adviser-requests', [AdviserAccountRequestController::class, 'index'])->name('adviser-requests.index');
    Route::post('/adviser-requests/{adviserAccountRequest}/approve', [AdviserAccountRequestController::class, 'approve'])->name('adviser-requests.approve');
    Route::post('/adviser-requests/{adviserAccountRequest}/reject', [AdviserAccountRequestController::class, 'reject'])->name('adviser-requests.reject');

    // docs/4.4-audit-trail-status-tracking.md — read access restricted to Admin, DPO Staff,
    // and Ethics Committee Chair (confirmed 2026-07-06). Access is gated by AuditLogPolicy,
    // not route middleware, matching the UserPolicy pattern above.
    Route::get('/audit-trail', [AuditLogController::class, 'index'])->name('audit-trail.index');
});
