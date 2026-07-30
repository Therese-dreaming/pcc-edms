<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

// Force-logout for suspended/deactivated users. Without this, an admin can set
// account_status to 'suspended' but the user's existing session stays valid until
// it naturally expires — they can still approve, sign, endorse, and manage.
class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && in_array($user->account_status, ['suspended', 'deactivated'], true)) {
            Auth::logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->withErrors(['email' => 'Your account has been suspended. Contact the administrator.']);
        }

        return $next($request);
    }
}
