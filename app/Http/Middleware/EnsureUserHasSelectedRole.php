<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// docs/4.1-user-roles-permissions.md — a self-registered account has no role until it picks
// one, so send it to the self-service picker instead of a wall of 403s. Admin-created accounts
// (Admin/Users/Create, bulk import) can also be left role-less on purpose — that's the admin
// choosing to assign a role manually later, not opting into the researcher/OJT-only picker — so
// this only ever fires for `self_registered` accounts. Route names are allow-listed rather than
// excluded by prefix so a new route is protected by default, not accidentally left open.
class EnsureUserHasSelectedRole
{
    private const ALLOWED_WITHOUT_ROLE = [
        'role.select',
        'role.select.store',
        'logout',
        'profile.edit',
        'profile.update',
        'profile.destroy',
        'verification.notice',
        'verification.verify',
        'verification.send',
        'password.confirm',
        'password.update',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasVerifiedEmail() || $user->role_id !== null || ! $user->self_registered) {
            return $next($request);
        }

        if ($request->routeIs(...self::ALLOWED_WITHOUT_ROLE)) {
            return $next($request);
        }

        return redirect()->route('role.select');
    }
}
