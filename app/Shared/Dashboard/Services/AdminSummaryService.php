<?php

namespace App\Shared\Dashboard\Services;

use App\Modules\Remis\Models\Decision;
use App\Modules\Remis\Models\RemisApplication;

// FRS §XVII "Administrator Dashboard" — the institution-wide summary tiles: total applications,
// pending reviews, approved, disapproved, and average processing time. REMIS-scoped, matching the
// FRS (the REC Clearance module). Returned as flat scalar stats (not the list-widget shape) so the
// dashboard renders them as stat tiles.
class AdminSummaryService
{
    /**
     * @return array{total: int, pending_reviews: int, approved: int, disapproved: int, avg_processing_days: ?float}
     */
    public function stats(): array
    {
        $total = RemisApplication::count();

        // "Pending reviews" = sitting in an active review stage (not yet decided).
        $pending = RemisApplication::whereIn('status', ['for_screening', 'for_review', 'under_endorsement'])->count();

        // Decisions are the authoritative approved/disapproved record.
        $approved = Decision::whereIn('outcome', ['approved', 'approved_with_conditions'])->count();
        $disapproved = Decision::where('outcome', 'disapproved')->count();

        return [
            'total' => $total,
            'pending_reviews' => $pending,
            'approved' => $approved,
            'disapproved' => $disapproved,
            'avg_processing_days' => $this->averageProcessingDays(),
        ];
    }

    /**
     * Mean days from submission to decision, over decided applications. Submission time is the
     * application's created_at (Form 1 submission creates it); decision time is decision_date.
     */
    private function averageProcessingDays(): ?float
    {
        $decisions = Decision::with('remisApplication:id,created_at')->get();

        $spans = $decisions
            ->filter(fn (Decision $d) => $d->remisApplication !== null)
            // abs(): Carbon 3 returns a signed diff, and a same-day decision (common in demo data)
            // would otherwise read as a small negative.
            ->map(fn (Decision $d) => abs($d->remisApplication->created_at->diffInDays($d->decision_date)));

        return $spans->isEmpty() ? null : round($spans->avg(), 1);
    }
}
