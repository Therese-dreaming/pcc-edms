<?php

namespace App\Shared\Onboarding\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Auth\Models\Role;
use App\Shared\Documents\Support\QrCode;
use App\Shared\Onboarding\Models\Cohort;
use App\Shared\Onboarding\Models\CohortMember;
use App\Shared\Onboarding\Services\CohortService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

// Adviser-facing class management. The point of this screen is that onboarding a 50-student class
// costs the adviser one form: create the cohort, share the code/link/QR, watch the roster fill.
// The manual add-member fallback lives here too, for students who can't self-enrol.
class CohortController extends Controller
{
    // The joiner roles a cohort may assign, by owner type. Advisers run research classes (researcher
    // roles); department coordinators run OJT batches (trainee roles). Never a staff role.
    private const RESEARCHER_ROLES = ['researcher_internal', 'researcher_external'];
    private const OJT_ROLES = ['ojt_trainee_internal', 'ojt_trainee_external'];

    /** The applicant roles the acting user is allowed to assign to their cohorts. */
    private function applicantRoleSlugs(\App\Models\User $user): array
    {
        // Admins can create either kind; coordinators OJT only; everyone else (advisers) researchers.
        return match (true) {
            $user->hasRole('system_administrator') => [...self::RESEARCHER_ROLES, ...self::OJT_ROLES],
            $user->hasRole('department_coordinator') => self::OJT_ROLES,
            default => self::RESEARCHER_ROLES,
        };
    }

    public function __construct(private readonly CohortService $cohorts)
    {
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Cohort::class);

        $query = Cohort::query()->with('role')->withCount([
            'members as joined_count' => fn ($q) => $q->where('status', 'joined'),
            'members as invited_count' => fn ($q) => $q->where('status', 'invited'),
        ])->latest();

        // Admins oversee every class; advisers see only their own.
        if (! $request->user()->hasRole('system_administrator')) {
            $query->where('adviser_id', $request->user()->id);
        }

        return Inertia::render('Adviser/Cohorts/Index', [
            'cohorts' => $query->get()->map(fn (Cohort $c) => [
                ...$c->only(['id', 'name', 'department', 'level', 'course', 'section', 'join_code', 'max_members', 'is_open']),
                'expires_at' => optional($c->expires_at)->toDateString(),
                'role' => $c->role?->name,
                'joined_count' => $c->joined_count,
                'invited_count' => $c->invited_count,
                'is_expired' => $c->isExpired(),
            ]),
            'status' => session('status'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Cohort::class);

        return Inertia::render('Adviser/Cohorts/Create', [
            'applicantRoles' => Role::whereIn('name', $this->applicantRoleSlugs(auth()->user()))->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Cohort::class);

        $roleIds = Role::whereIn('name', $this->applicantRoleSlugs(auth()->user()))->pluck('id')->all();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:255'],
            'course' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'role_id' => ['required', 'integer', 'in:' . implode(',', $roleIds)],
            'expires_at' => ['nullable', 'date', 'after:today'],
            'max_members' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'allowed_email_domains' => ['nullable', 'string', 'max:500'],
        ]);

        // Free-text "pcc.edu.ph, pccnet.edu.ph" -> a clean array; empty means any domain.
        $data['allowed_email_domains'] = $this->parseDomains($data['allowed_email_domains'] ?? null);

        $cohort = $this->cohorts->create($data, $request->user());

        return redirect()->route('adviser.cohorts.show', $cohort)
            ->with('status', 'Class created — share the join code or link below with your students.');
    }

    public function show(Cohort $cohort): Response
    {
        $this->authorize('view', $cohort);

        $cohort->load(['members.user', 'role', 'adviser']);

        return Inertia::render('Adviser/Cohorts/Show', [
            'cohort' => [
                ...$cohort->only(['id', 'name', 'department', 'level', 'course', 'section', 'join_code', 'max_members', 'is_open', 'allowed_email_domains']),
                'expires_at' => optional($cohort->expires_at)->toDateString(),
                'role' => $cohort->role?->name,
                'is_expired' => $cohort->isExpired(),
                'is_full' => $cohort->isFull(),
            ],
            'joinUrl' => $cohort->joinUrl(),
            // Reuses the certificate QR helper — advisers can project or print this.
            'joinQr' => QrCode::svgDataUri($cohort->joinUrl(), 320),
            'members' => $cohort->members->map(fn (CohortMember $m) => [
                ...$m->only(['id', 'full_name', 'email', 'student_number', 'status']),
                'invited_at' => optional($m->invited_at)->toDayDateTimeString(),
                'joined_at' => optional($m->joined_at)->toDayDateTimeString(),
                'invitation_expired' => $m->status === 'invited' && $m->isTokenExpired(),
                'account_verified' => $m->user?->hasVerifiedEmail() ?? false,
            ]),
            'status' => session('status'),
        ]);
    }

    public function edit(Cohort $cohort): Response
    {
        $this->authorize('update', $cohort);

        return Inertia::render('Adviser/Cohorts/Edit', [
            'cohort' => [
                ...$cohort->only(['id', 'name', 'department', 'level', 'course', 'section', 'role_id', 'max_members']),
                'expires_at' => optional($cohort->expires_at)->toDateString(),
                // Back to the free-text form the create screen uses.
                'allowed_email_domains' => implode(', ', $cohort->allowed_email_domains ?? []),
            ],
            'applicantRoles' => Role::whereIn('name', $this->applicantRoleSlugs(auth()->user()))->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Cohort $cohort): RedirectResponse
    {
        $this->authorize('update', $cohort);

        $roleIds = Role::whereIn('name', $this->applicantRoleSlugs(auth()->user()))->pluck('id')->all();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:255'],
            'course' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'role_id' => ['required', 'integer', 'in:' . implode(',', $roleIds)],
            // No `after:today` here, unlike store() — an expiry that has already lapsed must be
            // correctable or clearable, which is half the point of having an edit screen.
            'expires_at' => ['nullable', 'date'],
            'max_members' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'allowed_email_domains' => ['nullable', 'string', 'max:500'],
        ]);

        $data['allowed_email_domains'] = $this->parseDomains($data['allowed_email_domains'] ?? null);

        $this->cohorts->update($cohort, $data);

        return redirect()->route('adviser.cohorts.show', $cohort)->with('status', 'Class updated.');
    }

    public function toggleOpen(Request $request, Cohort $cohort): RedirectResponse
    {
        $this->authorize('update', $cohort);

        $open = ! $cohort->is_open;
        $this->cohorts->setOpen($cohort, $open);

        return back()->with('status', $open ? 'Class reopened — students can enrol again.' : 'Class closed — the join code no longer works.');
    }

    public function regenerateCode(Cohort $cohort): RedirectResponse
    {
        $this->authorize('update', $cohort);

        $this->cohorts->regenerateCode($cohort);

        return back()->with('status', 'New join code generated — any previously shared link has stopped working.');
    }

    public function addMember(Request $request, Cohort $cohort): RedirectResponse
    {
        $this->authorize('update', $cohort);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
        ]);

        try {
            $this->cohorts->inviteMember($cohort, $data['full_name'], $data['email']);
        } catch (RuntimeException $e) {
            return back()->withErrors(['full_name' => $e->getMessage()]);
        }

        return back()->with('status', "Invitation sent to {$data['email']}.");
    }

    /**
     * Paste-many fallback: "Name, email" (or "Name <tab> email") per line, straight from a
     * spreadsheet. Invalid lines are reported without discarding the valid ones.
     */
    public function addMembersBulk(Request $request, Cohort $cohort): RedirectResponse
    {
        $this->authorize('update', $cohort);

        $validated = $request->validate(['rows' => ['required', 'string', 'max:20000']]);

        [$rows, $malformed] = $this->parsePastedRows($validated['rows']);

        if ($rows === []) {
            return back()->withErrors(['rows' => 'No usable "Name, email" lines found. Put one student per line.']);
        }

        $result = $this->cohorts->inviteMembers($cohort, $rows);
        $errors = array_merge($malformed, $result['errors']);

        $message = "Invited {$result['invited']} student" . ($result['invited'] === 1 ? '' : 's') . '.';

        if ($errors !== []) {
            return back()->with('status', $message)->withErrors(['rows' => 'Skipped: ' . implode(' ', $errors)]);
        }

        return back()->with('status', $message);
    }

    public function resendInvitation(Cohort $cohort, CohortMember $member): RedirectResponse
    {
        $this->authorize('update', $cohort);
        $this->assertMemberBelongs($cohort, $member);

        try {
            $this->cohorts->resendInvitation($member);
        } catch (RuntimeException $e) {
            return back()->withErrors(['members' => $e->getMessage()]);
        }

        return back()->with('status', "Invitation resent to {$member->email}.");
    }

    public function removeMember(Cohort $cohort, CohortMember $member): RedirectResponse
    {
        $this->authorize('update', $cohort);
        $this->assertMemberBelongs($cohort, $member);

        $this->cohorts->removeMember($member);

        return back()->with('status', "{$member->full_name} removed from this class. Any account they already created is left untouched.");
    }

    private function assertMemberBelongs(Cohort $cohort, CohortMember $member): void
    {
        abort_unless($member->cohort_id === $cohort->id, 404);
    }

    /** @return array{0: list<array{full_name: string, email: string}>, 1: list<string>} */
    private function parsePastedRows(string $raw): array
    {
        $rows = [];
        $malformed = [];

        foreach (preg_split('/\r\n|\r|\n/', $raw) ?: [] as $line) {
            $line = trim($line);

            if ($line === '') {
                continue;
            }

            // Accept comma, tab, or semicolon between name and email (spreadsheet pastes vary).
            $parts = array_values(array_filter(array_map('trim', preg_split('/[,;\t]+/', $line) ?: [])));

            // Tolerate "email only" lines by using the local part as a provisional name.
            if (count($parts) === 1 && filter_var($parts[0], FILTER_VALIDATE_EMAIL)) {
                $rows[] = ['full_name' => Str::headline(strstr($parts[0], '@', true) ?: $parts[0]), 'email' => $parts[0]];
                continue;
            }

            if (count($parts) < 2) {
                $malformed[] = "\"{$line}\" (need a name and an email).";
                continue;
            }

            // The email is whichever field actually looks like one — handles "email, name" order too.
            $email = null;
            foreach ($parts as $part) {
                if (filter_var($part, FILTER_VALIDATE_EMAIL)) {
                    $email = $part;
                    break;
                }
            }

            if ($email === null) {
                $malformed[] = "\"{$line}\" (no valid email).";
                continue;
            }

            $name = trim(implode(' ', array_diff($parts, [$email])));

            $rows[] = ['full_name' => $name !== '' ? $name : $email, 'email' => $email];
        }

        return [$rows, $malformed];
    }

    /** @return list<string> */
    private function parseDomains(?string $raw): array
    {
        if ($raw === null || trim($raw) === '') {
            return [];
        }

        return array_values(array_unique(array_filter(array_map(
            // Accept "@pcc.edu.ph", "pcc.edu.ph" or a full address, store the bare domain.
            fn ($d) => strtolower(ltrim(trim($d), '@')),
            preg_split('/[,;\s]+/', $raw) ?: [],
        ))));
    }
}
