<?php

namespace App\Shared\Reports\Services;

use App\Modules\Remis\Incident\Models\Incident;
use App\Modules\Remis\Monitoring\Models\ProgressReport;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Support\Carbon;

// docs/5.1-reports-shared.md — "Applications by Department" and "Incident Summary" reports,
// visible to both DPO- and ORD-side report-capable roles.
class SharedReportService
{
    /**
     * @param  array{date_from?: ?string, date_to?: ?string, department?: ?string}  $filters
     */
    public function applicationsByDepartment(array $filters): array
    {
        $applications = ResearchApplication::query()
            ->with(['dpreqApplication', 'remisApplication'])
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($filters['department'] ?? null, fn ($q, $v) => $q->where('department', $v))
            ->get();

        $byDepartment = $applications->groupBy(fn ($app) => $app->department ?: 'Unspecified');

        $departments = $byDepartment->map(function ($apps, $department) {
            $dpreq = $apps->pluck('dpreqApplication')->filter();
            $remis = $apps->pluck('remisApplication')->filter();

            return [
                'department' => $department,
                'total' => $apps->count(),
                'dpreq_total' => $dpreq->count(),
                'dpreq_by_status' => $dpreq->countBy('status'),
                'remis_total' => $remis->count(),
                'remis_by_status' => $remis->countBy('status'),
            ];
        })->values();

        return [
            'departments' => $departments,
            'grand_total' => $applications->count(),
        ];
    }

    /**
     * @param  array{date_from?: ?string, date_to?: ?string, department?: ?string, incident_type?: ?string, severity?: ?string}  $filters
     */
    public function incidentSummary(array $filters): array
    {
        $incidents = Incident::query()
            ->with(['remisApplication.researchApplication', 'statusHistory'])
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('incident_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('incident_date', '<=', $v))
            ->when($filters['incident_type'] ?? null, fn ($q, $v) => $q->where('incident_type', $v))
            ->when($filters['severity'] ?? null, fn ($q, $v) => $q->where('severity', $v))
            ->when(
                $filters['department'] ?? null,
                fn ($q, $v) => $q->whereHas('remisApplication.researchApplication', fn ($rq) => $rq->where('department', $v))
            )
            ->latest('incident_date')
            ->get();

        $resolutionDays = $incidents
            ->filter(fn (Incident $incident) => in_array($incident->status, ['resolved', 'closed'], true))
            ->map(function (Incident $incident) {
                $resolvedAt = $incident->statusHistory
                    ->whereIn('to_status', ['resolved', 'closed'])
                    ->sortBy('created_at')
                    ->first()?->created_at;

                return $resolvedAt ? Carbon::parse($incident->incident_date)->diffInDays($resolvedAt) : null;
            })
            ->filter(fn ($days) => $days !== null);

        return [
            'incidents' => $incidents->map(fn (Incident $incident) => [
                'id' => $incident->id,
                'tracking_number' => $incident->remisApplication->tracking_number,
                'department' => $incident->remisApplication->researchApplication->department ?: 'Unspecified',
                'incident_type' => $incident->incident_type,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'incident_date' => $incident->incident_date->toDateString(),
            ])->values(),
            'by_type' => $incidents->countBy('incident_type'),
            'by_severity' => $incidents->countBy('severity'),
            'by_status' => $incidents->countBy('status'),
            'avg_resolution_days' => $resolutionDays->isNotEmpty() ? round($resolutionDays->avg(), 1) : null,
            'total' => $incidents->count(),
        ];
    }

    /**
     * docs/5.1: DPO's version of this report would track clearance conditions/compliance
     * attestations, but no such data model exists (DPREQ has no compliance-declaration concept
     * built) — this reads only REMIS's monitoring compliance_status (docs/3.4), the "REMIS
     * monitoring records" half of the two data sources this report definition names. Whether the
     * two should be unified is an open ASSUMPTION in docs/5.1 itself.
     *
     * @param  array{date_from?: ?string, date_to?: ?string, department?: ?string, compliance_status?: ?string}  $filters
     */
    public function complianceMonitoring(array $filters): array
    {
        $reports = ProgressReport::query()
            ->with('remisApplication.researchApplication')
            ->whereNotNull('compliance_status')
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('reviewed_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('reviewed_at', '<=', $v))
            ->when(
                $filters['department'] ?? null,
                fn ($q, $v) => $q->whereHas('remisApplication.researchApplication', fn ($rq) => $rq->where('department', $v))
            )
            ->when($filters['compliance_status'] ?? null, fn ($q, $v) => $q->where('compliance_status', $v))
            ->latest('reviewed_at')
            ->get();

        return [
            'rows' => $reports->map(fn (ProgressReport $r) => [
                'tracking_number' => $r->remisApplication->tracking_number,
                'department' => $r->remisApplication->researchApplication->department ?: 'Unspecified',
                'status_of_study' => $r->status_of_study,
                'compliance_status' => $r->compliance_status,
                'review_notes' => $r->review_notes,
                'reviewed_at' => $r->reviewed_at->toDateString(),
            ])->values(),
            'by_status' => $reports->countBy('compliance_status'),
            'total' => $reports->count(),
        ];
    }
}
