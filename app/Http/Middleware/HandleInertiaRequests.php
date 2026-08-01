<?php

namespace App\Http\Middleware;

use App\Shared\Notifications\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user()?->load('role');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'roleName' => $user?->role?->name,
            ],
            // One-shot flash messages (set via back()->with('success', …) etc.). Shared on every
            // response so the global SweetAlert feedback layer (resources/js/lib/feedback.js) can
            // toast them after the page they belong to renders. Laravel flashes these for a single
            // request, so they naturally disappear on the next navigation.
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
            ],
            // docs/4.3 — notification bell. Shared on every request (not fetched separately)
            // since this app has no websocket/polling infra; a full Inertia page visit already
            // refreshes it on every navigation, which is enough for an MVP in-app bell.
            'notifications' => $user ? [
                'unread_count' => Notification::where('user_id', $user->id)->whereNull('read_at')->count(),
                'recent' => Notification::where('user_id', $user->id)->latest()->limit(8)->get(),
            ] : null,
            // Which workspace modules this user actually has business in — the nav gates on this so
            // a trainee doesn't see REMIS, a researcher doesn't see DPNDA, etc. Computed once here
            // so the sidebar can't drift from real access; the module controllers still enforce
            // their own authorization (this is UX, not the security boundary).
            'can' => $this->moduleAccess($user?->role?->name),
        ];
    }

    /**
     * @return array{dpreq: bool, dpnda: bool, remis: bool, incidents: bool}
     */
    private function moduleAccess(?string $roleName): array
    {
        $in = fn (array $roles) => in_array($roleName, $roles, true);

        $applicants = ['researcher_internal', 'researcher_external'];
        $ojt = ['ojt_trainee_internal', 'ojt_trainee_external'];
        $endorsers = ['adviser', 'program_head', 'dean'];
        $ethics = ['ethics_secretariat', 'ethics_reviewer', 'ethics_committee_chair'];
        $admin = $roleName === 'system_administrator';

        return [
            // Data-privacy applications: researchers submit them, DPO staff act on them.
            'dpreq' => $admin || $in($applicants) || $roleName === 'dpo_staff',
            // OJT/trainee NDAs: coordinators create them, trainees sign them, DPO keeps records.
            'dpnda' => $admin || $roleName === 'department_coordinator' || $in($ojt) || $roleName === 'dpo_staff',
            // Ethics review: researchers submit, the academic chain endorses, ethics office reviews.
            'remis' => $admin || $in($applicants) || $in($endorsers) || $in($ethics),
            // Incidents: filed by a study's researcher or the ethics office.
            'incidents' => $admin || $in($applicants) || $in($ethics),
        ];
    }
}
