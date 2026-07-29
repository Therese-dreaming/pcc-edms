<?php

use App\Shared\Documents\Http\Controllers\FileManagerController;
use Illuminate\Support\Facades\Route;

// File Management System (DPO + System Administrator). A File-Explorer-style browser over all
// stored documents, split into system-generated forms vs applicant-submitted files. Access is
// gated by a role check inside the controller (dpo_staff + system_administrator), matching the
// admin/reports pattern. Actual downloads/previews reuse the existing documents.* routes.
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/files', [FileManagerController::class, 'index'])->name('files.index');
});
