<?php

use App\Shared\Reports\Http\Controllers\DpoReportController;
use App\Shared\Reports\Http\Controllers\OrdReportController;
use App\Shared\Reports\Http\Controllers\ReportController;
use App\Shared\Reports\Http\Controllers\SharedReportController;
use Illuminate\Support\Facades\Route;

// docs/5.1-5.3 — Reporting module. Each report route serves either an Inertia page or, with
// ?format=csv, a CSV download of the same filtered data set. Role checks happen inside each
// controller method (docs/0.2 "Generate reports" capability), not via route middleware.
Route::middleware(['auth', 'verified'])->prefix('reports')->name('reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('index');

    // docs/5.1 — shared
    Route::get('/applications-by-department', [SharedReportController::class, 'applicationsByDepartment'])->name('applications-by-department');
    Route::get('/incident-summary', [SharedReportController::class, 'incidentSummary'])->name('incident-summary');
    Route::get('/compliance-monitoring', [SharedReportController::class, 'complianceMonitoring'])->name('compliance-monitoring');

    // docs/5.2 — ORD
    Route::get('/risk-level', [OrdReportController::class, 'riskLevel'])->name('risk-level');
    Route::get('/reviewer-workload', [OrdReportController::class, 'reviewerWorkload'])->name('reviewer-workload');
    Route::get('/annual-ethics', [OrdReportController::class, 'annualEthics'])->name('annual-ethics');
    Route::get('/annual-ethics/pdf', [OrdReportController::class, 'annualEthicsPdf'])->name('annual-ethics.pdf');
    Route::get('/archive-studies', [OrdReportController::class, 'archiveStudies'])->name('archive-studies');

    // docs/5.3 — DPO
    Route::get('/nda-by-department-grade-level', [DpoReportController::class, 'ndaByDepartmentAndGradeLevel'])->name('nda-by-department-grade-level');
    Route::get('/pending-dpo-approvals', [DpoReportController::class, 'pendingApprovals'])->name('pending-dpo-approvals');
    Route::get('/student-teachers', [DpoReportController::class, 'studentTeachers'])->name('student-teachers');
    Route::get('/ojt-accommodated', [DpoReportController::class, 'ojtAccommodated'])->name('ojt-accommodated');
    Route::get('/whereabouts', [DpoReportController::class, 'whereabouts'])->name('whereabouts');
    Route::get('/ojt-evaluation-compliance', [DpoReportController::class, 'ojtEvaluationCompliance'])->name('ojt-evaluation-compliance');
});
