<?php

namespace App\Shared\Dashboard\Services;

use App\Models\User;
use App\Modules\Remis\Models\EndorsementAction;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Onboarding\Models\Cohort;

// Dashboard for the academic endorsement chain — Adviser, Program Head, Dean.
//
// docs/4.3 only ever specified dashboards for the two staff offices (DPO and ORD), so these three
// roles previously landed on the plain fallback message despite owning the first three steps of every
// REMIS application's journey. An adviser had no way to see what was waiting on them without
// trawling /remis.
//
// Widget contract is identical to Dpo/OrdDashboardService — ['count' => int, 'items' => [{label,
// detail, url, at}]] — so the existing WidgetCard renders these unchanged.
class EndorserDashboardService
{
    private const LIMIT = 8;

    public function widgets(User $user): array
    {
        $widgets = [
            'awaiting_my_endorsement' => $this->awaitingMyEndorsement($user),
            'for_revision' => $this->forRevision($user),
            'recently_endorsed' => $this->recentlyEndorsed($user),
        ];

        // Only advisers own cohorts; program heads and deans would always see an empty card.
        if ($user->hasAnyRole(['adviser', 'system_administrator'])) {
            $widgets['my_classes'] = $this->myClasses($user);
        }

        return $widgets;
    }

    private function awaitingMyEndorsement(User $user): array
    {
        $step = $this->stepFor($user);

        $query = RemisApplication::with('researchApplication')
            ->where('status', 'under_endorsement')
            ->when($step !== null, fn ($q) => $q->where('current_endorsement_step', $step))
            ->when(
                // An adviser's queue is their own students plus the unassigned pool — mirrors the
                // visibility rule in RemisApplicationController::index(). Applications with a null
                // adviser_id belong to nobody, so they must stay actionable by any adviser.
                $user->hasRole('adviser'),
                fn ($q) => $q->where(fn ($sub) => $sub->where('adviser_id', $user->id)->orWhereNull('adviser_id')),
            )
            ->latest('updated_at');

        return $this->present($query);
    }

    private function forRevision(User $user): array
    {
        $query = RemisApplication::with('researchApplication')
            ->where('status', 'for_revision')
            // Advisers see only their own students' revisions; the other endorsers have no ownership
            // column, so they see the whole for_revision queue as before.
            ->when(
                $user->hasRole('adviser'),
                fn ($q) => $q->where(fn ($sub) => $sub->where('adviser_id', $user->id)->orWhereNull('adviser_id')),
            )
            ->latest('updated_at');

        return $this->present($query);
    }

    private function recentlyEndorsed(User $user): array
    {
        $query = EndorsementAction::with('remisApplication.researchApplication')
            ->where('endorser_id', $user->id)
            ->where('acted_at', '>=', now()->subDays(30))
            ->latest('acted_at');

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::LIMIT)->get()
                // Guard against an endorsement whose application was since deleted.
                ->filter(fn (EndorsementAction $a) => $a->remisApplication !== null)
                ->map(fn (EndorsementAction $a) => [
                    'label' => $a->remisApplication->tracking_number,
                    'detail' => ucfirst($a->action).' — '.$a->remisApplication->researchApplication->research_title,
                    'url' => route('remis.show', $a->remis_application_id, false),
                    'at' => $a->acted_at->toDateString(),
                ])->values(),
        ];
    }

    private function myClasses(User $user): array
    {
        $query = Cohort::query()
            ->withCount([
                'members as joined_count' => fn ($q) => $q->where('status', 'joined'),
                'members as invited_count' => fn ($q) => $q->where('status', 'invited'),
            ])
            ->when(! $user->hasRole('system_administrator'), fn ($q) => $q->where('adviser_id', $user->id))
            ->latest();

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::LIMIT)->get()->map(fn (Cohort $c) => [
                'label' => $c->name,
                'detail' => $c->joined_count.' enrolled'
                    .($c->invited_count > 0 ? ", {$c->invited_count} invited" : '')
                    .($c->is_open && ! $c->isExpired() ? '' : ' · closed'),
                'url' => route('adviser.cohorts.show', $c->id, false),
                'at' => $c->created_at->toDateString(),
            ]),
        ];
    }

    /** The endorsement step this user owns, or null when they own none (e.g. an admin viewing). */
    private function stepFor(User $user): ?string
    {
        return match ($user->role?->name) {
            'adviser' => 'adviser',
            'program_head' => 'program_head',
            'dean' => 'dean',
            default => null,
        };
    }

    private function present($query): array
    {
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
}
