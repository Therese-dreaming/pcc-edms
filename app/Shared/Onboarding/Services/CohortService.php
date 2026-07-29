<?php

namespace App\Shared\Onboarding\Services;

use App\Models\User;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\Auth\Services\AdminUserService;
use App\Shared\Onboarding\Mail\CohortInvitationMail;
use App\Shared\Onboarding\Models\Cohort;
use App\Shared\Onboarding\Models\CohortMember;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use RuntimeException;

// Cohort onboarding. Two entry paths, one roster:
//   1. joinByCode()        — the primary path. A student self-enrols with the adviser's class code
//                            and supplies their own details, so the adviser types nothing.
//   2. inviteMember(s)/    — the fallback. The adviser adds someone by name + email and the system
//      acceptInvitation()    emails a single-use expiring link for them to finish setting up.
//
// Account creation always funnels through AdminUserService::createApplicant(), which owns the
// "applicant role + pending_validation + verification email + audit row" behaviour — this service
// never creates a User directly.
class CohortService
{
    // Invitation links live as long as an NDA signing link (ResearchTeamNdaService), for consistency.
    private const INVITATION_EXPIRY_DAYS = 14;

    // Unambiguous alphabet: no I/L/O/0/1, so a code read off a projector or whiteboard can't be
    // mis-transcribed. 10 chars over 31 symbols is far too large a space to brute-force, and the
    // public join routes are throttled on top of that.
    private const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    private const CODE_LENGTH = 10;

    public function __construct(
        private readonly AdminUserService $users,
        private readonly AuditLogService $auditLog,
    ) {
    }

    /**
     * The adviser who owns this applicant, derived from their class membership — null when they
     * belong to no cohort (an admin-created account, or one predating cohorts).
     *
     * This is what lets a submitted application be routed to one specific adviser instead of
     * broadcasting to every adviser in the institution. Kept here because `cohort_members` is this
     * module's data; callers (ResearchApplicationService) just ask the question.
     */
    public function adviserFor(User $applicant): ?User
    {
        $membership = CohortMember::with('cohort.adviser')
            ->where('user_id', $applicant->id)
            ->where('status', 'joined')
            ->latest('joined_at')
            ->first();

        return $membership?->cohort?->adviser;
    }

    public function create(array $data, User $adviser): Cohort
    {
        $cohort = Cohort::create([
            ...$data,
            'adviser_id' => $adviser->id,
            'join_code' => $this->generateJoinCode(),
            'is_open' => true,
        ]);

        $this->auditLog->record('cohort.created', $cohort, null, $cohort->only([
            'name',
            'department',
            'level',
            'course',
            'section',
            'role_id',
            'expires_at',
            'max_members',
        ]));

        return $cohort;
    }

    /**
     * Correct a class's details after creation — a mistyped name, a headcount cap set too low, an
     * expiry that needs extending, or domain restrictions that turned out too strict. The join code
     * is deliberately NOT editable here (use regenerateCode(), which makes the invalidation of
     * already-shared links explicit rather than a side effect of an edit).
     */
    public function update(Cohort $cohort, array $data): Cohort
    {
        $tracked = ['name', 'department', 'level', 'course', 'section', 'role_id', 'expires_at', 'max_members', 'allowed_email_domains'];

        $before = $cohort->only($tracked);

        $cohort->update($data);

        $after = $cohort->fresh()->only($tracked);
        // json_encode both sides so array values (allowed_email_domains) compare correctly —
        // array_diff_assoc on nested arrays would raise a notice.
        $changed = array_filter(
            $after,
            fn($value, $key) => json_encode($value) !== json_encode($before[$key] ?? null),
            ARRAY_FILTER_USE_BOTH,
        );

        if ($changed !== []) {
            $this->auditLog->record('cohort.updated', $cohort, array_intersect_key($before, $changed), $changed);
        }

        return $cohort->fresh();
    }

    public function regenerateCode(Cohort $cohort): Cohort
    {
        $old = $cohort->join_code;
        $cohort->update(['join_code' => $this->generateJoinCode()]);

        // Recorded because it invalidates every copy of the old link already shared.
        $this->auditLog->record('cohort.code_regenerated', $cohort, ['join_code' => $old], ['join_code' => $cohort->join_code]);

        return $cohort->fresh();
    }

    public function setOpen(Cohort $cohort, bool $open): Cohort
    {
        $cohort->update(['is_open' => $open]);

        $this->auditLog->record($open ? 'cohort.reopened' : 'cohort.closed', $cohort, null, ['is_open' => $open]);

        return $cohort->fresh();
    }

    /**
     * Primary path: a student enrols themselves with the class code.
     *
     * Every guard is enforced here rather than in the controller so the public HTTP route and any
     * future caller (a test, a console command) cannot bypass them.
     *
     * @param  array{full_name: string, email: string, student_number?: ?string, password: string}  $data
     *
     * @throws RuntimeException when a guard rejects the joiner
     */
    public function joinByCode(string $code, array $data): CohortMember
    {
        $cohort = Cohort::where('join_code', $code)->first();

        if ($cohort === null) {
            throw new RuntimeException('This class link is not valid.');
        }

        // Guard 1-3: open, not expired, not full.
        if ($reason = $cohort->rejectionReason()) {
            throw new RuntimeException(match ($reason) {
                'closed' => 'This class is no longer accepting enrolments.',
                'expired' => 'This class link has expired. Ask your adviser for a current one.',
                'full' => 'This class has reached its enrolment limit. Ask your adviser to admit you.',
            });
        }

        $email = strtolower(trim($data['email']));

        // Guard 4: institutional email domain, when the adviser restricted it.
        if (!$cohort->emailAllowed($email)) {
            $allowed = implode(', ', $cohort->allowed_email_domains ?? []);
            throw new RuntimeException("This class only accepts {$allowed} email addresses.");
        }

        // Guard 5: no duplicate account, no duplicate roster row.
        if (User::where('email', $email)->exists()) {
            throw new RuntimeException('An account already exists for this email address. Try signing in instead.');
        }

        if ($cohort->members()->where('email', $email)->exists()) {
            throw new RuntimeException('This email address is already on this class roster.');
        }

        return DB::transaction(function () use ($cohort, $data, $email) {
            $user = $this->users->createApplicant(
                [
                    'name' => $data['full_name'],
                    'email' => $email,
                    'role_id' => $cohort->role_id,
                    'student_number' => $data['student_number'] ?? null,
                    'department' => $cohort->department,
                ],
                researchTitle: null,
                // The student chose this during enrolment, so no password-setup link is sent — but
                // email verification still applies before the account can do anything.
                password: $data['password'],
                auditEvent: 'user.self_enrolled_via_cohort',
            );

            $member = CohortMember::create([
                'cohort_id' => $cohort->id,
                'user_id' => $user->id,
                'full_name' => $data['full_name'],
                'email' => $email,
                'student_number' => $data['student_number'] ?? null,
                'status' => 'joined',
                'joined_at' => now(),
            ]);

            $this->auditLog->record('cohort.member_joined', $member, null, [
                'cohort_id' => $cohort->id,
                'user_id' => $user->id,
                'email' => $email,
            ]);

            return $member;
        });
    }

    /**
     * Fallback path: the adviser adds a student who can't self-enrol, and the system emails them a
     * personal setup link. No account is created until they accept — so no-shows leave no shell
     * accounts behind.
     */
    public function inviteMember(Cohort $cohort, string $fullName, string $email): CohortMember
    {
        $email = strtolower(trim($email));

        if (!$cohort->emailAllowed($email)) {
            $allowed = implode(', ', $cohort->allowed_email_domains ?? []);
            throw new RuntimeException("{$email} is not one of this class's allowed domains ({$allowed}).");
        }

        if (User::where('email', $email)->exists()) {
            throw new RuntimeException("An account already exists for {$email}.");
        }

        if ($cohort->members()->where('email', $email)->exists()) {
            throw new RuntimeException("{$email} is already on this roster.");
        }

        $member = CohortMember::create([
            'cohort_id' => $cohort->id,
            'full_name' => $fullName,
            'email' => $email,
            'status' => 'invited',
        ]);

        $this->issueInvitation($member);

        $this->auditLog->record('cohort.member_invited', $member, null, [
            'cohort_id' => $cohort->id,
            'email' => $email,
        ]);

        return $member->fresh();
    }

    /**
     * Bulk version of the fallback — the adviser pastes "Name, email" rows straight from a
     * spreadsheet. Invalid rows are reported rather than aborting the whole paste, so one typo
     * doesn't lose the other 49.
     *
     * @param  list<array{full_name: string, email: string}>  $rows
     * @return array{invited: int, errors: list<string>}
     */
    public function inviteMembers(Cohort $cohort, array $rows): array
    {
        $invited = 0;
        $errors = [];

        foreach ($rows as $row) {
            try {
                $this->inviteMember($cohort, $row['full_name'], $row['email']);
                $invited++;
            } catch (RuntimeException $e) {
                $errors[] = $e->getMessage();
            }
        }

        return ['invited' => $invited, 'errors' => $errors];
    }

    public function resendInvitation(CohortMember $member): CohortMember
    {
        if ($member->hasJoined()) {
            throw new RuntimeException('This member has already set up their account.');
        }

        $this->issueInvitation($member);

        $this->auditLog->record('cohort.invitation_resent', $member, null, ['email' => $member->email]);

        return $member->fresh();
    }

    /**
     * The invited student completes their own details and password via the emailed link.
     *
     * @param  array{full_name?: string, student_number?: ?string, password: string}  $data
     */
    public function acceptInvitation(string $token, array $data): CohortMember
    {
        $member = CohortMember::where('invitation_token', $token)->with('cohort')->first();

        if ($member === null) {
            throw new RuntimeException('This invitation link is not valid.');
        }

        if ($member->hasJoined()) {
            throw new RuntimeException('This invitation has already been used.');
        }

        if ($member->status === 'removed') {
            throw new RuntimeException('This invitation is no longer active. Contact your adviser.');
        }

        if ($member->isTokenExpired()) {
            throw new RuntimeException('This invitation has expired. Ask your adviser to resend it.');
        }

        if (User::where('email', $member->email)->exists()) {
            throw new RuntimeException('An account already exists for this email address. Try signing in instead.');
        }

        return DB::transaction(function () use ($member, $data) {
            $fullName = trim((string) ($data['full_name'] ?? '')) ?: $member->full_name;

            $user = $this->users->createApplicant(
                [
                    'name' => $fullName,
                    'email' => $member->email,
                    'role_id' => $member->cohort->role_id,
                    'student_number' => $data['student_number'] ?? null,
                    'department' => $member->cohort->department,
                ],
                researchTitle: null,
                password: $data['password'],
                auditEvent: 'user.accepted_cohort_invitation',
            );

            $member->update([
                'user_id' => $user->id,
                'full_name' => $fullName,
                'student_number' => $data['student_number'] ?? null,
                'status' => 'joined',
                'joined_at' => now(),
                // Consume the token — single use.
                'invitation_token' => null,
                'token_expires_at' => null,
            ]);

            $this->auditLog->record('cohort.member_joined', $member, null, [
                'cohort_id' => $member->cohort_id,
                'user_id' => $user->id,
                'via' => 'invitation',
            ]);

            return $member->fresh();
        });
    }

    /**
     * Take someone off the roster. Deliberately does NOT delete their user account if one exists —
     * removing a student from a class is not grounds for destroying an account that may already own
     * submissions. Deactivation stays an admin action (AdminUserService::updateUser).
     */
    public function removeMember(CohortMember $member): void
    {
        $member->update([
            'status' => 'removed',
            'invitation_token' => null,
            'token_expires_at' => null,
        ]);

        $this->auditLog->record('cohort.member_removed', $member, null, ['email' => $member->email]);
    }

    private function issueInvitation(CohortMember $member): void
    {
        $expiresAt = now()->addDays(self::INVITATION_EXPIRY_DAYS);

        $member->update([
            'invitation_token' => $this->uniqueToken(),
            'token_expires_at' => $expiresAt,
            'invited_at' => now(),
            'status' => 'invited',
        ]);

        $cohort = $member->cohort;

        // Sent synchronously (send(), not queue()) — the student is waiting on this link and there
        // is no queue worker running in this deployment (concern 6 / A2). Bulk invites still loop
        // one SMTP send per row; acceptable for classroom-sized cohorts.
        Mail::to($member->email)->send(new CohortInvitationMail(
            memberName: $member->full_name,
            cohortName: $cohort->name,
            adviserName: $cohort->adviser->name,
            acceptUrl: route('join.invitation', $member->fresh()->invitation_token),
            expiresAt: $expiresAt->format('F j, Y g:i A'),
        ));
    }

    private function uniqueToken(): string
    {
        do {
            $token = Str::random(64);
        } while (CohortMember::where('invitation_token', $token)->exists());

        return $token;
    }

    private function generateJoinCode(): string
    {
        do {
            $code = '';
            for ($i = 0; $i < self::CODE_LENGTH; $i++) {
                $code .= self::CODE_ALPHABET[random_int(0, strlen(self::CODE_ALPHABET) - 1)];
            }
        } while (Cohort::where('join_code', $code)->exists());

        return $code;
    }
}
