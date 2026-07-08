<?php

namespace App\Shared\Reports\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Reports\Support\ChecksReportAccess;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// docs/5.1-5.3 — landing page listing the reports the acting user's role can generate.
class ReportController extends Controller
{
    use ChecksReportAccess;

    public function index(Request $request): Response
    {
        $user = $request->user();
        $this->authorizeReportAccess($user, $this->sharedReportRoles);

        $reports = [
            ['name' => 'Applications by Department', 'route' => 'reports.applications-by-department', 'roles' => $this->sharedReportRoles],
            ['name' => 'Incident Summary', 'route' => 'reports.incident-summary', 'roles' => $this->sharedReportRoles],
            ['name' => 'Compliance Monitoring Report', 'route' => 'reports.compliance-monitoring', 'roles' => $this->sharedReportRoles],
            ['name' => 'Applications by Risk Level', 'route' => 'reports.risk-level', 'roles' => $this->ordReportRoles],
            ['name' => 'Reviewer Workload', 'route' => 'reports.reviewer-workload', 'roles' => $this->ordReportRoles],
            ['name' => 'Annual Ethics Report', 'route' => 'reports.annual-ethics', 'roles' => $this->ordReportRoles],
            ['name' => 'Archive Studies Report', 'route' => 'reports.archive-studies', 'roles' => $this->ordReportRoles],
            ['name' => 'NDAs by Department and Grade Level', 'route' => 'reports.nda-by-department-grade-level', 'roles' => $this->dpoReportRoles],
            ['name' => 'Pending DPO Approvals', 'route' => 'reports.pending-dpo-approvals', 'roles' => $this->dpoReportRoles],
            ['name' => 'OJTs Accommodated', 'route' => 'reports.ojt-accommodated', 'roles' => $this->dpoReportRoles],
            ['name' => "Trainee Whereabouts", 'route' => 'reports.whereabouts', 'roles' => $this->dpoReportRoles],
            ['name' => 'OJT Evaluation Report Compliance', 'route' => 'reports.ojt-evaluation-compliance', 'roles' => $this->dpoReportRoles],
        ];

        $available = collect($reports)
            ->filter(fn ($report) => $user->hasAnyRole($report['roles']))
            ->map(fn ($report) => ['name' => $report['name'], 'route' => $report['route']])
            ->values();

        return Inertia::render('Reports/Index', ['reports' => $available]);
    }
}
