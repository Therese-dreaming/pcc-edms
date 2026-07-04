<?php

use App\Shared\Auth\Http\Controllers\AdminUserController;
use Illuminate\Support\Facades\Route;

// docs/4.1-user-roles-permissions.md — user management, system_administrator only. Role checks
// happen via UserPolicy (authorize() calls in the controller), not route middleware, matching
// the pattern already used by the Reports module.
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::get('/users/create', [AdminUserController::class, 'create'])->name('users.create');
    Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
    Route::get('/users/import', [AdminUserController::class, 'importForm'])->name('users.import');
    Route::post('/users/import/preview', [AdminUserController::class, 'preview'])->name('users.import.preview');
    Route::post('/users/import/confirm', [AdminUserController::class, 'confirmImport'])->name('users.import.confirm');
    Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
});
