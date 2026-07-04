<?php

namespace App\Shared\Reports\Services;

use App\Modules\Remis\Models\Decision;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Models\ReviewAssignment;
use App\Modules\Remis\Models\RiskClassification;
use App\Modules\Remis\Monitoring\Models\CompletionReport;
use App\Modules\Remis\Monitoring\Models\ProgressReport;

// docs/5.2-reports-ord.md — REMIS/Ethics-side reports.
class OrdReportService
{
    /**
     * @param  array{date_from?: ?string, date_to?: ?string, department?: ?string, study_type?: ?string}  $filters
     */
    public function riskLevel(array $filters): array
    {
        $classifications = RiskClassification::query()
            ->with('remisApplication.researchApplication')
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('classification_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('classification_date', '<=', $v))
            ->when(
                $filters['department'] ?? null,
                fn ($q, $v) => $q->whereHas('remisApplication.researchApplication', fn ($rq) => $rq->where('department', $v))
            )
            ->when(
                $filters['study_type'] ?? null,
                fn ($q, $v) => $q->whereHas('remisApplication', fn ($rq) => $rq->where('study_type', $v))
            )
            ->get();

        return [
            'rows' => $classifications->map(fn (RiskClassification $c) => [
                'tracking_number' => $c->remisApplication->tracking_number,
                'department' => $c->remisApplication->researchApplication->department ?: 'Unspecified',
                'study_type' => $c->remisApplication->study_type,
                'level' => $c->level,
                'review_type' => $c->review_type,
                'classification_date' => $c->classification_date->toDateString(),
            ])->values(),
            'by_level' => $classifications->countBy('level'),
            'total' => $classifications->count(),
        ];
    }

    /**
     * @param  array{date_from?: ?string, date_to?: ?string, reviewer_id?: ?string, risk_track?: ?string}  $filters
     */
    public function reviewerWorkload(array $filters): array
    {
        $assignments = ReviewAssignment::query()
            ->with(['reviewer', 'remisApplication.riskClassification'])
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('assigned_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('assigned_at', '<=', $v))
            ->when($filters['reviewer_id'] ?? null, fn ($q, $v) => $q->where('reviewer_id', $v))
            ->when(
                $filters['risk_track'] ?? null,
                fn ($q, $v) => $q->whereHas('remisApplication.riskClassification', fn ($rq) => $rq->where('review_type', $v))
            )
            ->get();

        $byReviewer = $assignments->groupBy(fn (ReviewAssignment $a) => $a->reviewer->name);

        $rows = $byReviewer->map(function ($group, $reviewerName) {
            $completed = $group->whereNotNull('submitted_at');
            $turnaround = $completed->map(fn (ReviewAssignment $a) => $a->assigned_at->diffInDays($a->submitted_at));

            return [
                'reviewer' => $reviewerName,
                'active' => $group->whereNull('submitted_at')->count(),
                'completed' => $completed->count(),
                'avg_turnaround_days' => $turnaround->isNotEmpty() ? round($turnaround->avg(), 1) : null,
            ];
        })->values();

        return ['rows' => $rows];
    }

    public function annualEthicsReport(int $year): array
    {
        $submitted = RemisApplication::query()->with('researchApplication')
            ->whereYear('created_at', $year)
            ->get();

        $decisions = Decision::query()->whereYear('decision_date', $year)->get();

        $classifications = RiskClassification::query()
            ->whereYear('classification_date', $year)
            ->get();

        $complianceSummary = ProgressReport::query()
            ->whereYear('reviewed_at', $year)
            ->whereNotNull('compliance_status')
            ->get()
            ->countBy('compliance_status');

        return [
            'year' => $year,
            'total_submitted' => $submitted->count(),
            'total_approved' => $decisions->filter(fn (Decision $d) => $d->isPositive())->count(),
            'total_deferred' => $decisions->where('outcome', 'deferred')->count(),
            'total_disapproved' => $decisions->where('outcome', 'disapproved')->count(),
            'by_risk_level' => $classifications->countBy('level'),
            'by_department' => $submitted->countBy(fn (RemisApplication $a) => $a->researchApplication->department ?: 'Unspecified'),
            'by_study_type' => $submitted->countBy('study_type'),
            'archived_count' => CompletionReport::query()->whereYear('archived_at', $year)->count(),
            'compliance_summary' => $complianceSummary,
        ];
    }

    /**
     * @param  array{date_from?: ?string, date_to?: ?string, department?: ?string, final_outcome?: ?string}  $filters
     */
    public function archiveStudies(array $filters): array
    {
        $completions = CompletionReport::query()
            ->with('remisApplication.researchApplication.applicant')
            ->whereNotNull('archived_at')
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('archived_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('archived_at', '<=', $v))
            ->when(
                $filters['department'] ?? null,
                fn ($q, $v) => $q->whereHas('remisApplication.researchApplication', fn ($rq) => $rq->where('department', $v))
            )
            ->when($filters['final_outcome'] ?? null, fn ($q, $v) => $q->where('final_outcome', $v))
            ->latest('archived_at')
            ->get();

        return [
            'rows' => $completions->map(fn (CompletionReport $c) => [
                'tracking_number' => $c->remisApplication->tracking_number,
                'research_title' => $c->remisApplication->researchApplication->research_title,
                'applicant' => $c->remisApplication->researchApplication->applicant->name,
                'department' => $c->remisApplication->researchApplication->department ?: 'Unspecified',
                'final_outcome' => $c->final_outcome,
                'archived_at' => $c->archived_at->toDateString(),
            ])->values(),
            'total' => $completions->count(),
        ];
    }
}
