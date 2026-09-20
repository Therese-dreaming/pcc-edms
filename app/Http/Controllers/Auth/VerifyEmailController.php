<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// The signed route (/verify-email/{id}/{hash}?signature=…) no longer sits behind `auth`:
// stakeholders reported that opening the link on a second device dropped them on the login
// page with no explanation, while the tab left open on /verify-email never updated. The
// signature itself — HMAC over id + hash + expiry, throttled 6/min — is the proof of control
// of the mailbox, so the click can complete verification for guests too. Guests land back on
// the login page with a success message; authenticated users go to the dashboard.
class VerifyEmailController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $user = User::find((int) $request->route('id'));

        // The signature guarantees the pair (id, hash) was issued by us; this checks the email
        // behind that hash hasn't since changed (which silently invalidates old links).
        if ($user === null || !hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return redirect()->route('login')->with('error',
                'This verification link is no longer valid — the account or email address changed. Request a new link after signing in.');
        }

        if (!$user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        if (Auth::check()) {
            return redirect()
                ->intended(route('dashboard', absolute: false).'?verified=1')
                ->with('success', 'Your email address has been verified — welcome to PCC-EDMS.');
        }

        return redirect()->route('login')->with('success',
            'Your email address has been verified and your account is active. Sign in to continue.');
    }
}
