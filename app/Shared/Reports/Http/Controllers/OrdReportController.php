<?php

namespace App\Shared\Reports\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Documents\Services\PdfGenerationService;
use App\Shared\Reports\Services\OrdReportService;
use App\Shared\Reports\Support\ChecksReportAccess;
use App\Shared\Reports\Support\CsvResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

// docs/5.2-reports-ord.md — REMIS/Ethics-side reports.
class OrdReportController extends Controller
{
    use ChecksReportAccess;

    public function __construct(
        private readonly OrdReportService $reports,
        private readonly PdfGenerationService $pdf,
    ) {
    }

    public function riskLevel(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->ordReportRoles);

        $filters = $request->only(['date_from', 'date_to', 'department', 'study_type']);
        $data = $this->reports->riskLevel($filters);

        if ($request->query('format') === 'csv') {
            return CsvResponse::make('applications-by-risk-level.csv', [
                'Tracking #', 'Department', 'Study Type', 'Risk Level', 'Review Type', 'Classification Date',
            ], $data['rows']->map(fn ($row) => [
                $row['tracking_number'], $row['department'], $row['study_type'],
                $row['level'], $row['review_type'], $row['classification_date'],
            ]));
        }

        return Inertia::render('Reports/RiskLevel', ['filters' => $filters, 'data' => $data]);
    }

    public function reviewerWorkload(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->ordReportRoles);

        $filters = $request->only(['date_from', 'date_to', 'reviewer_id', 'risk_track']);
        $data = $this->reports->reviewerWorkload($filters);

        if ($request->query('format') === 'csv') {
            return CsvResponse::make('reviewer-workload.csv', [
                'Reviewer', 'Active', 'Completed', 'Avg Turnaround (days)',
            ], $data['rows']->map(fn ($row) => [
                $row['reviewer'], $row['active'], $row['completed'], $row['avg_turnaround_days'],
            ]));
        }

        return Inertia::render('Reports/ReviewerWorkload', ['filters' => $filters, 'data' => $data]);
    }

    public function annualEthics(Request $request): Response
    {
        $this->authorizeReportAccess($request->user(), $this->ordReportRoles);

        $year = (int) $request->query('year', now()->year);
        $data = $this->reports->annualEthicsReport($year);

        return Inertia::render('Reports/AnnualEthics', ['year' => $year, 'data' => $data]);
    }

    public function annualEthicsPdf(Request $request): HttpResponse
    {
        $this->authorizeReportAccess($request->user(), $this->ordReportRoles);

        $year = (int) $request->query('year', now()->year);
        $data = $this->reports->annualEthicsReport($year);

        $bytes = $this->pdf->generate('pdf.reports.annual-ethics-report', ['data' => $data]);

        return response($bytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"annual-ethics-report-{$year}.pdf\"",
        ]);
    }

    public function archiveStudies(Request $request): Response|StreamedResponse
    {
        $this->authorizeReportAccess($request->user(), $this->ordReportRoles);

        $filters = $request->only(['date_from', 'date_to', 'department', 'final_outcome']);
        $data = $this->reports->archiveStudies($filters);

        if ($request->query('format') === 'csv') {
            return CsvResponse::make('archive-studies.csv', [
                'Tracking #', 'Research Title', 'PI', 'Department', 'Final Outcome', 'Archived At',
            ], $data['rows']->map(fn ($row) => [
                $row['tracking_number'], $row['research_title'], $row['applicant'],
                $row['department'], $row['final_outcome'], $row['archived_at'],
            ]));
        }

        return Inertia::render('Reports/ArchiveStudies', ['filters' => $filters, 'data' => $data]);
    }
}
