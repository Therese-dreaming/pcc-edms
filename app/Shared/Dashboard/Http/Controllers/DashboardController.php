<?php

namespace App\Shared\Dashboard\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Dashboard\Services\DpoDashboardService;
use App\Shared\Dashboard\Services\OrdDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// docs/4.3-esignature-notifications.md "Notification Dashboards (DPO and ORD)" — replaces the
// placeholder Dashboard page with role-appropriate widgets. Roles outside both offices (Requester
// roles, adviser/program_head/dean, trainees) get neither: docs/4.3 only defines dashboards for
// the two staff offices, not a per-role dashboard for every capability-matrix row.
class DashboardController extends Controller
{
    private const DPO_ROLES = ['dpo_staff'];
    private const ORD_ROLES = ['ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair'];

    public function __construct(
        private readonly DpoDashboardService $dpoDashboard,
        private readonly OrdDashboardService $ordDashboard,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $roleName = $user->role?->name;

        $isDpo = in_array($roleName, self::DPO_ROLES, true) || $roleName === 'system_administrator';
        $isOrd = in_array($roleName, self::ORD_ROLES, true) || $roleName === 'system_administrator';

        return Inertia::render('Dashboard', [
            'dpoWidgets' => $isDpo ? $this->dpoDashboard->widgets($user) : null,
            'ordWidgets' => $isOrd ? $this->ordDashboard->widgets($user) : null,
        ]);
    }
}
