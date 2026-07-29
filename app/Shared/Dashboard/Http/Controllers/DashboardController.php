<?php

namespace App\Shared\Dashboard\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Dashboard\Services\AdminSummaryService;
use App\Shared\Dashboard\Services\DpoDashboardService;
use App\Shared\Dashboard\Services\EndorserDashboardService;
use App\Shared\Dashboard\Services\OrdDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// docs/4.3-esignature-notifications.md "Notification Dashboards (DPO and ORD)" — replaces the
// placeholder Dashboard page with role-appropriate widgets.
//
// docs/4.3 only defined dashboards for the two staff offices, which left the academic endorsement
// chain (adviser / program head / dean) on the bare fallback message even though those roles own the
// first three steps of every REMIS application. Added 2026-07-25 as a third widget set. Requester
// roles and trainees still get the fallback — they have nothing queued on them.
class DashboardController extends Controller
{
    private const DPO_ROLES = ['dpo_staff'];
    private const ORD_ROLES = ['ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair'];
    private const ENDORSER_ROLES = ['adviser', 'program_head', 'dean'];

    public function __construct(
        private readonly DpoDashboardService $dpoDashboard,
        private readonly OrdDashboardService $ordDashboard,
        private readonly EndorserDashboardService $endorserDashboard,
        private readonly AdminSummaryService $adminSummary,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $roleName = $user->role?->name;
        $isAdmin = $roleName === 'system_administrator';

        $isDpo = in_array($roleName, self::DPO_ROLES, true) || $isAdmin;
        $isOrd = in_array($roleName, self::ORD_ROLES, true) || $isAdmin;
        $isEndorser = in_array($roleName, self::ENDORSER_ROLES, true) || $isAdmin;

        return Inertia::render('Dashboard', [
            'dpoWidgets' => $isDpo ? $this->dpoDashboard->widgets($user) : null,
            'ordWidgets' => $isOrd ? $this->ordDashboard->widgets($user) : null,
            'endorserWidgets' => $isEndorser ? $this->endorserDashboard->widgets($user) : null,
            // FRS §XVII administrator summary tiles.
            'adminSummary' => $isAdmin ? $this->adminSummary->stats() : null,
        ]);
    }
}
