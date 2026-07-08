<?php

namespace App\Shared\Dashboard\Services;

use App\Models\User;
use App\Modules\Dpnda\Models\DpndaRecord;
use App\Modules\Dpreq\Models\DpreqApplication;

// docs/4.3-esignature-notifications.md "Notification Dashboards (DPO and ORD)" — the DPO
// office's widget set. "Overdue Monitoring" is REMIS/ORD-only per the doc's own table, so it
// has no DPO counterpart here.
class DpoDashboardService
{
    private const LIMIT = 8;

    public function widgets(User $user): array
    {
        return [
            'new_submissions' => $this->newSubmissions(),
            'pending_my_action' => $this->pendingMyAction($user),
            'returned' => $this->returned(),
            'recently_completed' => $this->recentlyCompleted(),
        ];
    }

    private function newSubmissions(): array
    {
        $query = DpreqApplication::with('researchApplication')
            ->where('status', 'submitted')
            ->latest();

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::LIMIT)->get()->map(fn (DpreqApplication $a) => [
                'label' => $a->tracking_number,
                'detail' => $a->researchApplication->research_title,
                'url' => route('dpreq.show', $a->id, false),
                'at' => $a->created_at->toDateString(),
            ]),
        ];
    }

    // docs/4.3: "Pending My Action | Records assigned to the logged-in reviewer/approver" —
    // DPREQ has no per-user assignment for screening/endorsement/approval (docs/0.2's capability
    // matrix gates those by role, not by a specific assignee), and dpo_staff owns every DPO-side
    // status from screening through final approval (DPO Approver was retired as a separate role).
    private function pendingMyAction(User $user): array
    {
        $statuses = ['screening', 'under_review', 'endorsed'];

        $query = DpreqApplication::with('researchApplication')
            ->whereIn('status', $statuses)
            ->latest();

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::LIMIT)->get()->map(fn (DpreqApplication $a) => [
                'label' => $a->tracking_number,
                'detail' => $a->researchApplication->research_title,
                'url' => route('dpreq.show', $a->id, false),
                'at' => $a->updated_at->toDateString(),
            ]),
        ];
    }

    private function returned(): array
    {
        $query = DpreqApplication::with('researchApplication')
            ->where('status', 'returned')
            ->latest();

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::LIMIT)->get()->map(fn (DpreqApplication $a) => [
                'label' => $a->tracking_number,
                'detail' => $a->researchApplication->research_title,
                'url' => route('dpreq.show', $a->id, false),
                'at' => $a->updated_at->toDateString(),
            ]),
        ];
    }

    private function recentlyCompleted(): array
    {
        $since = now()->subDays(30);

        $dpreq = DpreqApplication::with('researchApplication')
            ->where('status', 'clearance_issued')
            ->where('updated_at', '>=', $since)
            ->get()
            ->map(fn (DpreqApplication $a) => [
                'label' => $a->tracking_number,
                'detail' => 'DPREQ clearance issued — '.$a->researchApplication->research_title,
                'url' => route('dpreq.show', $a->id, false),
                'at' => $a->updated_at,
            ]);

        $dpnda = DpndaRecord::with('placement')
            ->where('status', 'completed')
            ->where('updated_at', '>=', $since)
            ->get()
            ->map(fn (DpndaRecord $r) => [
                'label' => $r->tracking_number,
                'detail' => 'NDA completed — '.$r->placement->traineeFullName(),
                'url' => route('dpnda.show', $r->id, false),
                'at' => $r->updated_at,
            ]);

        $combined = $dpreq->concat($dpnda)->sortByDesc('at')->values();

        return [
            'count' => $combined->count(),
            'items' => $combined->take(self::LIMIT)->map(fn ($i) => [...$i, 'at' => $i['at']->toDateString()])->values(),
        ];
    }
}
