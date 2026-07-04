<?php

use App\Shared\Notifications\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

// docs/4.3-esignature-notifications.md — in-app notification bell + history.
Route::middleware(['auth', 'verified'])->prefix('notifications')->name('notifications.')->group(function () {
    Route::get('/', [NotificationController::class, 'index'])->name('index');
    Route::post('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('read');
    Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
});
