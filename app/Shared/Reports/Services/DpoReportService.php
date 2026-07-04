<?php

namespace App\Shared\Reports\Services;

use App\Modules\Dpnda\Models\DpndaRecord;
use App\Modules\Dpnda\Models\Placement;
use App\Modules\Dpreq\Models\DpreqApplication;
use Illuminate\Support\Carbon;

// docs/5.3-reports-dpo.md — DPO-side reports, built against the `placements` /
// `dpnda_records` schema (docs/2.1's recommendation, followed when those tables were migrated).
class DpoReportService
{
    /**
     * @param  array{date_from?: ?string, date_to?: ?string}  $filters
     */
    public function ndaByDepartmentAndGradeLevel(array $filters): array
    {
        $records = DpndaRecord::query()
            ->with('placement')
            ->where('status', 'completed')
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('coordinator_signed_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('coordinator_signed_at', '<=', $v))
            ->get();

        $levels = $records->pluck('placement.level')->filter()->unique()->sort()->values();

        $byDepartment = $records->groupBy(fn (DpndaRecord $r) => $r->placement->department_assigned);

        $rows = $byDepartment->map(function ($group, $department) use ($levels) {
            $byLevel = $group->countBy('placement.level');

            return [
                'department' => $department,
                'counts' => $levels->mapWithKeys(fn ($level) => [$level => $byLevel->get($level, 0)]),
                'total' => $group->count(),
            ];
        })->values();

        return ['levels' => $levels, 'rows' => $rows, 'grand_total' => $records->count()];
    }

    /**
     * @param  array{date_from?: ?string, date_to?: ?string, department?: ?string}  $filters
     */
    public function pendingApprovals(array $filters): array
    {
        $pendingStatuses = ['submitted', 'screening', 'returned', 'under_review', 'endorsed'];

        $applications = DpreqApplication::query()
            ->with(['applicant', 'researchApplication', 'statusHistory.changedBy'])
            ->whereIn('status', $pendingStatuses)
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($filters['department'] ?? null, fn ($q, $v) => $q->where('department', $v))
            ->get();

        $rows = $applications->map(function (DpreqApplication $app) {
            $latestHistory = $app->statusHistory->first();

            return [
                'id' => $app->id,
                'tracking_number' => $app->tracking_number,
                'applicant' => $app->applicant->name,
                'department' => $app->department ?: 'Unspecified',
                'submitted_at' => $app->created_at->toDateString(),
                'status' => $app->status,
                'comments' => $latestHistory?->comments,
                'days_pending' => (int) Carbon::parse($latestHistory?->created_at ?? $app->created_at)->diffInDays(now()),
            ];
        })->values();

        return ['rows' => $rows, 'total' => $rows->count()];
    }

    /**
     * @param  array{date_from?: ?string, date_to?: ?string}  $filters
     */
    public function studentTeachers(array $filters): array
    {
        $placements = Placement::query()
            ->where('trainee_type', 'student_teacher')
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('start_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('start_date', '<=', $v))
            ->get();

        // docs/5.3 asks for an "external and internal" breakdown, but `trainee_type` only
        // distinguishes internal/external for OJT placements (internal_ojt/external_ojt), not
        // student teachers — that axis doesn't exist in the schema yet. Grouped without it here;
        // flagged as a gap for the next session rather than guessed at.
        $rows = $placements
            ->groupBy(fn (Placement $p) => "{$p->level}|{$p->department_assigned}|{$p->enrolled_school}")
            ->map(function ($group) {
                $first = $group->first();

                return [
                    'level' => $first->level,
                    'department_assigned' => $first->department_assigned,
                    'enrolled_school' => $first->enrolled_school,
                    'count' => $group->count(),
                ];
            })->values();

        return ['rows' => $rows, 'total' => $placements->count()];
    }

    /**
     * @param  array{date_from?: ?string, date_to?: ?string, granularity?: ?string}  $filters
     */
    public function ojtAccommodated(array $filters): array
    {
        $granularity = ($filters['granularity'] ?? 'month') === 'year' ? 'year' : 'month';

        $placements = Placement::query()
            ->whereIn('trainee_type', ['internal_ojt', 'external_ojt'])
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('start_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('start_date', '<=', $v))
            ->get();

        $rows = $placements
            ->groupBy(fn (Placement $p) => $p->start_date->format($granularity === 'year' ? 'Y' : 'Y-m')
                ."|{$p->enrolled_school}|{$p->department_assigned}|{$p->trainee_type}")
            ->map(function ($group) use ($granularity) {
                $first = $group->first();

                return [
                    'period' => $first->start_date->format($granularity === 'year' ? 'Y' : 'Y-m'),
                    'enrolled_school' => $first->enrolled_school,
                    'department_assigned' => $first->department_assigned,
                    'trainee_type' => $first->trainee_type,
                    'count' => $group->count(),
                ];
            })
            ->sortBy('period')
            ->values();

        return ['rows' => $rows, 'total' => $placements->count(), 'granularity' => $granularity];
    }

    /**
     * @param  array{as_of?: ?string, department_assigned?: ?string}  $filters
     */
    public function whereabouts(array $filters): array
    {
        $asOf = $filters['as_of'] ?? now()->toDateString();

        $placements = Placement::query()
            ->whereDate('start_date', '<=', $asOf)
            ->whereDate('end_date', '>=', $asOf)
            ->when($filters['department_assigned'] ?? null, fn ($q, $v) => $q->where('department_assigned', $v))
            ->orderBy('department_assigned')
            ->get();

        return [
            'as_of' => $asOf,
            'rows' => $placements->map(fn (Placement $p) => [
                'trainee' => $p->traineeFullName(),
                'trainee_type' => $p->trainee_type,
                'department_assigned' => $p->department_assigned,
                'enrolled_school' => $p->enrolled_school,
                'start_date' => $p->start_date->toDateString(),
                'end_date' => $p->end_date->toDateString(),
            ])->values(),
            'total' => $placements->count(),
        ];
    }

    /**
     * docs/5.3 "Offices and departments that have uploaded OJT evaluation reports, and those
     * without". Grouped by placement period (end date), per the doc's "date range (placement
     * period)" filter — a placement's evaluation report is expected once its placement ends.
     *
     * @param  array{date_from?: ?string, date_to?: ?string, department?: ?string}  $filters
     */
    public function ojtEvaluationCompliance(array $filters): array
    {
        $placements = Placement::query()
            ->with('ojtEvaluationReport')
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('end_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('end_date', '<=', $v))
            ->when($filters['department'] ?? null, fn ($q, $v) => $q->where('department_assigned', $v))
            ->get();

        $rows = $placements
            ->groupBy('department_assigned')
            ->map(function ($group, $department) {
                $uploaded = $group->filter(fn (Placement $p) => $p->ojtEvaluationReport !== null);

                return [
                    'department' => $department,
                    'uploaded' => $uploaded->count(),
                    'not_uploaded' => $group->count() - $uploaded->count(),
                    'total' => $group->count(),
                ];
            })
            ->values();

        return [
            'rows' => $rows,
            'compliant_departments' => $rows->filter(fn ($r) => $r['total'] > 0 && $r['not_uploaded'] === 0)->pluck('department')->values(),
            'non_compliant_departments' => $rows->filter(fn ($r) => $r['not_uploaded'] > 0)->pluck('department')->values(),
            'total' => $placements->count(),
        ];
    }
}
