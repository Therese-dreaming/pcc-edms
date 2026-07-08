<?php

namespace App\Shared\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Auth\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// docs/4.1-user-roles-permissions.md — the four self-service roles a self-registered (not
// admin-created) account can pick for itself once verified. Every other role
// (department_coordinator, dpo_staff, adviser, ethics roles, system_administrator, ...) is
// intentionally left out of SELECTABLE_ROLES — those still need an admin to assign them via
// Admin/Users/Edit, matching the existing "manual role assignment" flow rather than replacing
// it. Gated on `self_registered` (not just role_id === null) so an admin-created account left
// role-less on purpose can't wander in here and grant itself a researcher/OJT role.
class RoleSelectionController extends Controller
{
    private const SELECTABLE_ROLES = [
        'researcher_internal',
        'researcher_external',
        'ojt_trainee_internal',
        'ojt_trainee_external',
    ];

    public function create(Request $request): Response|RedirectResponse
    {
        if ($request->user()->role_id !== null || ! $request->user()->self_registered) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/SelectRole', [
            'roles' => Role::whereIn('name', self::SELECTABLE_ROLES)
                ->get(['id', 'name'])
                ->sortBy(fn ($role) => array_search($role->name, self::SELECTABLE_ROLES, true))
                ->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->self_registered, 403);

        if ($request->user()->role_id !== null) {
            return redirect()->route('dashboard');
        }

        $data = $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $role = Role::findOrFail($data['role_id']);

        abort_unless(in_array($role->name, self::SELECTABLE_ROLES, true), 403);

        $request->user()->update(['role_id' => $role->id]);

        return redirect()->route('dashboard');
    }
}
