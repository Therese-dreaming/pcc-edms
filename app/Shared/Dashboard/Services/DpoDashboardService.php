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
    // DPREQ has no per-user assignment (docs/0.2's capability matrix gates by role), and the single
    // dpo_staff role owns everything awaiting DPO action. After the 2026-07-25 collapse that is
    // just `submitted` (needs to be taken under review) and `under_review` (needs a decision).
    private function pendingMyAction(User $user): array
    {
        $statuses = ['submitted', 'under_review'];

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
