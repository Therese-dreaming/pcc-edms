<?php

namespace App\Shared\Reports\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Reports\Services\DpoReportService;
use App\Shared\Reports\Support\ChecksReportAccess;
use App\Shared\Reports\Support\CsvResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

// docs/5.3-reports-dpo.md — DPO-side reports.
class DpoReportController extends Controller
{
    use ChecksReportAccess;

    public function __construct(private readonly DpoReportService $reports)
    {
    }

    public function ndaByDepartmentAndGradeLevel(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->dpoReportRoles);

        $filters = $request->only(['date_from', 'date_to']);
        $data = $this->reports->ndaByDepartmentAndGradeLevel($filters);

        if ($request->query('format') === 'csv') {
            $levels = $data['levels']->all();

            return CsvResponse::make('nda-by-department-grade-level.csv', [
                'Department', ...$levels, 'Total',
            ], $data['rows']->map(fn ($row) => [
                $row['department'], ...array_map(fn ($l) => $row['counts'][$l], $levels), $row['total'],
            ]));
        }

        return Inertia::render('Reports/NdaByDepartmentGradeLevel', ['filters' => $filters, 'data' => $data]);
    }

    public function pendingApprovals(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->dpoReportRoles);

        $filters = $request->only(['date_from', 'date_to', 'department']);
        $data = $this->reports->pendingApprovals($filters);

        if ($request->query('format') === 'csv') {
            return CsvResponse::make('pending-dpo-approvals.csv', [
                'Tracking #', 'Applicant', 'Department', 'Submitted', 'Status', 'Comments', 'Days Pending',
            ], $data['rows']->map(fn ($row) => [
                $row['tracking_number'], $row['applicant'], $row['department'],
                $row['submitted_at'], $row['status'], $row['comments'], $row['days_pending'],
            ]));
        }

        return Inertia::render('Reports/PendingApprovals', ['filters' => $filters, 'data' => $data]);
    }

    public function ojtAccommodated(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->dpoReportRoles);

        $filters = $request->only(['date_from', 'date_to', 'granularity']);
        $data = $this->reports->ojtAccommodated($filters);

        if ($request->query('format') === 'csv') {
            return CsvResponse::make('ojt-accommodated.csv', [
                'Period', 'School', 'Department', 'Type', 'Count',
            ], $data['rows']->map(fn ($row) => [
                $row['period'], $row['enrolled_school'], $row['department_assigned'], $row['trainee_type'], $row['count'],
            ]));
        }

        return Inertia::render('Reports/OjtAccommodated', ['filters' => $filters, 'data' => $data]);
    }

    public function whereabouts(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->dpoReportRoles);

        $filters = $request->only(['as_of', 'department_assigned']);
        $data = $this->reports->whereabouts($filters);

        if ($request->query('format') === 'csv') {
            return CsvResponse::make('whereabouts.csv', [
                'Trainee', 'Type', 'Department', 'School', 'Start', 'End',
            ], $data['rows']->map(fn ($row) => [
                $row['trainee'], $row['trainee_type'], $row['department_assigned'],
                $row['enrolled_school'], $row['start_date'], $row['end_date'],
            ]));
        }

        return Inertia::render('Reports/Whereabouts', ['filters' => $filters, 'data' => $data]);
    }

    public function ojtEvaluationCompliance(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->dpoReportRoles);

        $filters = $request->only(['date_from', 'date_to', 'department']);
        $data = $this->reports->ojtEvaluationCompliance($filters);

        if ($request->query('format') === 'csv') {
            return CsvResponse::make('ojt-evaluation-compliance.csv', [
                'Department', 'Uploaded', 'Not Uploaded', 'Total',
            ], $data['rows']->map(fn ($row) => [
                $row['department'], $row['uploaded'], $row['not_uploaded'], $row['total'],
            ]));
        }

        return Inertia::render('Reports/OjtEvaluationCompliance', ['filters' => $filters, 'data' => $data]);
    }
}
