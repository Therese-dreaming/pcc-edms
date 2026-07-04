<?php

namespace App\Shared\Reports\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Reports\Services\SharedReportService;
use App\Shared\Reports\Support\ChecksReportAccess;
use App\Shared\Reports\Support\CsvResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

// docs/5.1-reports-shared.md — reports visible to both DPO and ORD report-capable roles.
class SharedReportController extends Controller
{
    use ChecksReportAccess;

    public function __construct(private readonly SharedReportService $reports)
    {
    }

    public function applicationsByDepartment(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->sharedReportRoles);

        $filters = $request->only(['date_from', 'date_to', 'department']);
        $data = $this->reports->applicationsByDepartment($filters);

        if ($request->query('format') === 'csv') {
            return CsvResponse::make('applications-by-department.csv', [
                'Department', 'Total', 'DPREQ Total', 'REMIS Total',
            ], $data['departments']->map(fn ($row) => [
                $row['department'], $row['total'], $row['dpreq_total'], $row['remis_total'],
            ]));
        }

        return Inertia::render('Reports/ApplicationsByDepartment', [
            'filters' => $filters,
            'data' => $data,
        ]);
    }

    public function incidentSummary(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->sharedReportRoles);

        $filters = $request->only(['date_from', 'date_to', 'department', 'incident_type', 'severity']);
        $data = $this->reports->incidentSummary($filters);

        if ($request->query('format') === 'csv') {
            return CsvResponse::make('incident-summary.csv', [
                'Tracking #', 'Department', 'Type', 'Severity', 'Status', 'Incident Date',
            ], $data['incidents']->map(fn ($row) => [
                $row['tracking_number'], $row['department'], $row['incident_type'],
                $row['severity'], $row['status'], $row['incident_date'],
            ]));
        }

        return Inertia::render('Reports/IncidentSummary', [
            'filters' => $filters,
            'data' => $data,
        ]);
    }

    public function complianceMonitoring(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->sharedReportRoles);

        $filters = $request->only(['date_from', 'date_to', 'department', 'compliance_status']);
        $data = $this->reports->complianceMonitoring($filters);

        if ($request->query('format') === 'csv') {
            return CsvResponse::make('compliance-monitoring.csv', [
                'Tracking #', 'Department', 'Status of Study', 'Compliance Status', 'Notes', 'Reviewed At',
            ], $data['rows']->map(fn ($row) => [
                $row['tracking_number'], $row['department'], $row['status_of_study'],
                $row['compliance_status'], $row['review_notes'], $row['reviewed_at'],
            ]));
        }

        return Inertia::render('Reports/ComplianceMonitoring', [
            'filters' => $filters,
            'data' => $data,
        ]);
    }
}
