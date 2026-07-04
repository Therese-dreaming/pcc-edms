<?php

use App\Http\Controllers\ProfileController;
use App\Shared\Dashboard\Http\Controllers\DashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
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
