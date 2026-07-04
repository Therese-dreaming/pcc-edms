<?php

namespace App\Shared\Dashboard\Services;

use App\Models\User;
use App\Modules\Remis\Models\Decision;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Models\ReviewAssignment;
use App\Modules\Remis\Monitoring\Services\RemisMonitoringService;

// docs/4.3-esignature-notifications.md "Notification Dashboards (DPO and ORD)" — the ORD/Ethics
// office's widget set.
//
// "Overdue Monitoring (ORD only)" — docs/HANDOFF.md Part G: the requester confirmed a monthly
// progress-report cadence, resolving docs/3.4's previously-unconfirmed "Monitoring Due Date"
// ASSUMPTION. Due-date computation lives in RemisMonitoringService::monitoringDueDate(), not
// duplicated here, since it's also the single source of truth for that cadence policy.
class OrdDashboardService
{
    private const LIMIT = 8;

    public function __construct(private readonly RemisMonitoringService $monitoring)
    {
    }

    public function widgets(User $user): array
    {
        return [
            'new_submissions' => $this->newSubmissions(),
            'pending_my_action' => $this->pendingMyAction($user),
            'for_revision' => $this->forRevision(),
            'recently_completed' => $this->recentlyCompleted(),
            'overdue_monitoring' => $this->overdueMonitoring(),
        ];
    }

    private function newSubmissions(): array
    {
        // docs/4.3: "New Submissions (unscreened)" — REMIS's transient draft_submitted status
        // never persists (RemisWorkflowService::submit() advances it to under_endorsement in the
        // same call), so the first status a study actually rests at, unscreened, is
        // `for_screening`.
        $query = RemisApplication::with('researchApplication')
            ->where('status', 'for_screening')
            ->latest();

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::LIMIT)->get()->map(fn (RemisApplication $a) => [
                'label' => $a->tracking_number,
                'detail' => $a->researchApplication->research_title,
                'url' => route('remis.show', $a->id, false),
                'at' => $a->updated_at->toDateString(),
            ]),
        ];
    }

    private function pendingMyAction(User $user): array
    {
        if ($user->role?->name === 'ethics_reviewer') {
            $query = ReviewAssignment::with('remisApplication.researchApplication')
                ->where('reviewer_id', $user->id)
                ->whereNull('submitted_at')
                ->latest('assigned_at');

            return [
                'count' => $query->count(),
                'items' => $query->limit(self::LIMIT)->get()->map(fn (ReviewAssignment $ra) => [
                    'label' => $ra->remisApplication->tracking_number,
                    'detail' => $ra->remisApplication->researchApplication->research_title,
                    'url' => route('remis.show', $ra->remis_application_id, false),
                    'at' => $ra->assigned_at->toDateString(),
                ]),
            ];
        }

        $status = $user->role?->name === 'ethics_committee_chair' ? 'for_review' : 'for_screening';

        $query = RemisApplication::with('researchApplication')
            ->where('status', $status)
            ->latest();

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::LIMIT)->get()->map(fn (RemisApplication $a) => [
                'label' => $a->tracking_number,
                'detail' => $a->researchApplication->research_title,
                'url' => route('remis.show', $a->id, false),
                'at' => $a->updated_at->toDateString(),
            ]),
        ];
    }

    private function forRevision(): array
    {
        $query = RemisApplication::with('researchApplication')
            ->where('status', 'for_revision')
            ->latest();

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::LIMIT)->get()->map(fn (RemisApplication $a) => [
                'label' => $a->tracking_number,
                'detail' => $a->researchApplication->research_title,
                'url' => route('remis.show', $a->id, false),
                'at' => $a->updated_at->toDateString(),
            ]),
        ];
    }

    private function recentlyCompleted(): array
    {
        $query = Decision::with('remisApplication.researchApplication')
            ->where('decision_date', '>=', now()->subDays(30))
            ->latest('decision_date');

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::LIMIT)->get()->map(fn (Decision $d) => [
                'label' => $d->remisApplication->tracking_number,
                'detail' => ucwords(str_replace('_', ' ', $d->outcome)).' — '.$d->remisApplication->researchApplication->research_title,
                'url' => route('remis.show', $d->remis_application_id, false),
                'at' => $d->decision_date->toDateString(),
            ]),
        ];
    }

    private function overdueMonitoring(): array
    {
        $overdue = RemisApplication::with(['researchApplication', 'progressReports', 'statusHistory'])
            ->where('status', 'monitoring')
            ->get()
            ->filter(fn (RemisApplication $a) => $this->monitoring->isMonitoringOverdue($a))
            ->sortBy(fn (RemisApplication $a) => $this->monitoring->monitoringDueDate($a))
            ->values();

        return [
            'count' => $overdue->count(),
            'items' => $overdue->take(self::LIMIT)->map(fn (RemisApplication $a) => [
                'label' => $a->tracking_number,
                'detail' => $a->researchApplication->research_title,
                'url' => route('remis.show', $a->id, false),
                'at' => $this->monitoring->monitoringDueDate($a)->toDateString(),
            ]),
        ];
    }
}
