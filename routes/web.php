<?php

use App\Http\Controllers\ProfileController;
use App\Shared\Auth\Http\Controllers\RoleSelectionController;
use App\Shared\Dashboard\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route(auth()->check() ? 'dashboard' : 'login');
});

// Public, unauthenticated — linked from the login page's "About" nav item.
Route::get('/about', function () {
    return Inertia::render('About');
})->name('about');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// docs/4.1-user-roles-permissions.md — self-service role pick for the four researcher/OJT
// roles, shown once per account (see EnsureUserHasSelectedRole middleware) right after email
// verification. Every other role stays admin-assigned.
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/select-role', [RoleSelectionController::class, 'create'])->name('role.select');
    Route::post('/select-role', [RoleSelectionController::class, 'store'])->name('role.select.store');
});

require __DIR__.'/dpreq.php';
require __DIR__.'/dpnda.php';
require __DIR__.'/remis.php';
require __DIR__.'/incidents.php';
require __DIR__.'/reports.php';
require __DIR__.'/notifications.php';
require __DIR__.'/admin.php';
require __DIR__.'/verify.php';
require __DIR__.'/auth.php';
