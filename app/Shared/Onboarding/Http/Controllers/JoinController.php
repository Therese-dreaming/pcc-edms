<?php

namespace App\Shared\Onboarding\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Onboarding\Models\Cohort;
use App\Shared\Onboarding\Models\CohortMember;
use App\Shared\Onboarding\Services\CohortService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

// PUBLIC, unauthenticated enrolment — the whole point is that the student, not the adviser, does the
// typing. This is NOT open self-registration: the adviser's join code is the gate (expiring,
// cappable, domain-restrictable, revocable), and email verification still applies afterwards.
// Routes are throttled, mirroring the public NDA signing and verification portals.
//
// Guard enforcement lives in CohortService, not here, so no caller can bypass it. This controller
// only resolves which state to render and hands validated input over.
class JoinController extends Controller
{
    public function __construct(private readonly CohortService $cohorts)
    {
    }

    public function showCohort(string $code): Response
    {
        $cohort = Cohort::where('join_code', $code)->first();

        if ($cohort === null) {
            return Inertia::render('Join/Cohort', ['state' => 'invalid']);
        }

        return Inertia::render('Join/Cohort', [
            'code' => $code,
            // 'closed' | 'expired' | 'full' | null -> 'usable'
            'state' => $cohort->rejectionReason() ?? 'usable',
            'cohort' => [
                'name' => $cohort->name,
                'adviser_name' => $cohort->adviser->name,
                'department' => $cohort->department,
                'course' => $cohort->course,
                'section' => $cohort->section,
                'allowed_email_domains' => $cohort->allowed_email_domains ?? [],
            ],
        ]);
    }

    public function join(Request $request, string $code): RedirectResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'student_number' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        try {
            $member = $this->cohorts->joinByCode($code, $data);
        } catch (RuntimeException $e) {
            return back()->withErrors(['email' => $e->getMessage()])->withInput();
        }

        // Sign them straight in; the `verified` middleware then routes them to /verify-email, which
        // is the same path a Breeze signup took. They never see /select-role — their role came from
        // the cohort (see EnsureUserHasSelectedRole).
        Auth::login($member->user);

        return redirect()->route('dashboard');
    }

    public function showInvitation(string $token): Response
    {
        $member = CohortMember::where('invitation_token', $token)->with('cohort.adviser')->first();

        if ($member === null) {
            return Inertia::render('Join/Invitation', ['state' => 'invalid']);
        }

        $state = match (true) {
            $member->hasJoined() => 'used',
            $member->status === 'removed' => 'revoked',
            $member->isTokenExpired() => 'expired',
            default => 'usable',
        };

        return Inertia::render('Join/Invitation', [
            'token' => $token,
            'state' => $state,
            'member' => $member->only(['full_name', 'email']),
            'cohort' => [
                'name' => $member->cohort->name,
                'adviser_name' => $member->cohort->adviser->name,
            ],
        ]);
    }

    public function acceptInvitation(Request $request, string $token): RedirectResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'student_number' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        try {
            $member = $this->cohorts->acceptInvitation($token, $data);
        } catch (RuntimeException $e) {
            return back()->withErrors(['password' => $e->getMessage()])->withInput();
        }

        Auth::login($member->user);

        return redirect()->route('dashboard');
    }
}
