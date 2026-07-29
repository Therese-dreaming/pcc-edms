<?php

namespace Tests\Feature;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use App\Shared\Onboarding\Models\Cohort;
use App\Shared\Onboarding\Models\CohortMember;
use App\Shared\Onboarding\Services\CohortService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

// Cohort self-enrolment guard matrix. Every rejection must create NO user — that's the property
// that keeps a shared class code from becoming open registration by another name.
class CohortJoinTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'Str0ng-Passw0rd!';

    private User $adviser;
    private Cohort $cohort;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();

        $adviserRole = Role::create(['name' => 'adviser', 'side' => 'remis']);
        $applicantRole = Role::create(['name' => 'researcher_internal', 'side' => 'dpo']);

        $this->adviser = User::factory()->create([
            'role_id' => $adviserRole->id,
            'account_status' => 'active',
        ]);

        $this->cohort = app(CohortService::class)->create([
            'name' => 'BSIT-4A Research 2026',
            'department' => 'College of Computer Studies',
            'course' => 'BSIT',
            'section' => 'A',
            'role_id' => $applicantRole->id,
        ], $this->adviser);
    }

    private function joinPayload(array $overrides = []): array
    {
        return array_merge([
            'full_name' => 'Ana Cruz',
            'email' => 'ana.cruz@pcc.edu.ph',
            'student_number' => '2026-00123',
            'password' => self::PASSWORD,
            'password_confirmation' => self::PASSWORD,
        ], $overrides);
    }

    /** @test */
    public function a_student_can_self_enrol_with_a_valid_code(): void
    {
        $response = $this->post(route('join.cohort.store', $this->cohort->join_code), $this->joinPayload());

        $response->assertRedirect(route('dashboard'));

        $user = User::where('email', 'ana.cruz@pcc.edu.ph')->first();
        $this->assertNotNull($user);
        $this->assertSame($this->cohort->role_id, $user->role_id, 'role comes from the cohort');
        $this->assertSame('College of Computer Studies', $user->department);
        $this->assertSame('2026-00123', $user->student_number);
        $this->assertSame('pending_validation', $user->account_status);
        $this->assertFalse((bool) $user->self_registered);
        $this->assertNull($user->email_verified_at, 'email verification is still required');

        $this->assertDatabaseHas('cohort_members', [
            'cohort_id' => $this->cohort->id,
            'user_id' => $user->id,
            'status' => 'joined',
        ]);
    }

    /** @test */
    public function an_enrolled_student_is_never_sent_to_select_role(): void
    {
        $this->post(route('join.cohort.store', $this->cohort->join_code), $this->joinPayload());

        // Their role is already set, so the role picker must not intercept them; the unverified
        // email should send them to the verification notice instead.
        $this->actingAs(User::where('email', 'ana.cruz@pcc.edu.ph')->first())
            ->get(route('dashboard'))
            ->assertRedirect(route('verification.notice'));
    }

    /** @test */
    public function an_unknown_code_creates_nothing(): void
    {
        $this->get(route('join.cohort', 'NOSUCHCODE'))->assertInertia(fn($page) => $page
            ->component('Join/Cohort')
            ->where('state', 'invalid'));

        $this->post(route('join.cohort.store', 'NOSUCHCODE'), $this->joinPayload())
            ->assertSessionHasErrors('email');

        $this->assertDatabaseCount('users', 1); // the adviser only
    }

    /** @test */
    public function a_closed_cohort_rejects_enrolment(): void
    {
        $this->cohort->update(['is_open' => false]);

        $this->assertRejected('closed');
    }

    /** @test */
    public function an_expired_cohort_rejects_enrolment(): void
    {
        $this->cohort->update(['expires_at' => now()->subDay()]);

        $this->assertRejected('expired');
    }

    /** @test */
    public function a_full_cohort_rejects_enrolment(): void
    {
        $this->cohort->update(['max_members' => 1]);
        CohortMember::create([
            'cohort_id' => $this->cohort->id,
            'full_name' => 'Already There',
            'email' => 'taken@pcc.edu.ph',
            'status' => 'joined',
            'joined_at' => now(),
        ]);

        $this->assertRejected('full');
    }

    /** @test */
    public function an_email_outside_the_allowed_domains_is_rejected(): void
    {
        $this->cohort->update(['allowed_email_domains' => ['pcc.edu.ph']]);

        $this->post(route('join.cohort.store', $this->cohort->join_code), $this->joinPayload([
            'email' => 'someone@gmail.com',
        ]))->assertSessionHasErrors('email');

        $this->assertDatabaseMissing('users', ['email' => 'someone@gmail.com']);
        $this->assertDatabaseCount('users', 1);
    }

    /** @test */
    public function an_existing_email_cannot_enrol_again(): void
    {
        User::factory()->create(['email' => 'ana.cruz@pcc.edu.ph']);

        $this->post(route('join.cohort.store', $this->cohort->join_code), $this->joinPayload())
            ->assertSessionHasErrors('email');

        $this->assertSame(1, User::where('email', 'ana.cruz@pcc.edu.ph')->count());
    }

    /** @test */
    public function an_invited_member_can_accept_and_the_link_is_single_use(): void
    {
        $service = app(CohortService::class);

        $member = $service->inviteMember($this->cohort, 'Ben Reyes', 'ben.reyes@pcc.edu.ph');
        $this->assertSame('invited', $member->status);
        $this->assertNull($member->user_id, 'no account exists until the invitation is accepted');
        // A2 — invitation mail is now sent synchronously (not queued) so it doesn't depend on a
        // queue worker running.
        Mail::assertSent(\App\Shared\Onboarding\Mail\CohortInvitationMail::class);

        $token = $member->invitation_token;

        $this->post(route('join.invitation.accept', $token), [
            'full_name' => 'Ben Reyes',
            'student_number' => '2026-00124',
            'password' => self::PASSWORD,
            'password_confirmation' => self::PASSWORD,
        ])->assertRedirect(route('dashboard'));

        $member->refresh();
        $this->assertSame('joined', $member->status);
        $this->assertNotNull($member->user_id);
        $this->assertNull($member->invitation_token, 'token is consumed on acceptance');

        // Accepting signs them in, and the join routes are guest-only — so the realistic re-use
        // case is a different visitor opening a forwarded link. Log out to exercise that path
        // rather than the guest-middleware redirect.
        $this->post(route('logout'));

        $this->post(route('join.invitation.accept', $token), [
            'full_name' => 'Someone Else',
            'password' => self::PASSWORD,
            'password_confirmation' => self::PASSWORD,
        ])->assertSessionHasErrors();

        $this->assertSame(1, User::where('email', 'ben.reyes@pcc.edu.ph')->count());
    }

    /** @test */
    public function an_expired_invitation_is_refused(): void
    {
        $service = app(CohortService::class);
        $member = $service->inviteMember($this->cohort, 'Cara Lim', 'cara.lim@pcc.edu.ph');
        $token = $member->invitation_token;

        $member->update(['token_expires_at' => now()->subDay()]);

        $this->expectException(RuntimeException::class);

        try {
            $service->acceptInvitation($token, ['full_name' => 'Cara Lim', 'password' => self::PASSWORD]);
        } finally {
            $this->assertDatabaseMissing('users', ['email' => 'cara.lim@pcc.edu.ph']);
        }
    }

    /** @test */
    public function removing_a_member_keeps_any_account_they_already_created(): void
    {
        $this->post(route('join.cohort.store', $this->cohort->join_code), $this->joinPayload());
        $member = CohortMember::where('email', 'ana.cruz@pcc.edu.ph')->first();

        app(CohortService::class)->removeMember($member);

        $this->assertSame('removed', $member->fresh()->status);
        $this->assertDatabaseHas('users', ['email' => 'ana.cruz@pcc.edu.ph']);
    }

    /** @test */
    public function the_cohort_page_gives_the_adviser_a_shareable_code_link_and_scannable_qr(): void
    {
        $this->adviser->update(['email_verified_at' => now()]);

        $this->actingAs($this->adviser)
            ->get(route('adviser.cohorts.show', $this->cohort->id))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Adviser/Cohorts/Show')
                    ->where('cohort.join_code', $this->cohort->join_code)
                    ->where('joinUrl', route('join.cohort', $this->cohort->join_code))
                    // A real rendered QR, not just the raw token as text.
                    ->where('joinQr', fn(string $qr) => str_starts_with($qr, 'data:image/svg+xml;base64,')
                        && str_contains(base64_decode(substr($qr, 26)), '<svg'))
            );
    }

    /** @test */
    public function pasted_rows_invite_the_whole_list_at_once(): void
    {
        $this->adviser->update(['email_verified_at' => now()]);

        // Deliberately mixed formats: comma, tab, reversed order, and one unusable line.
        $rows = "Ana Cruz, ana@pcc.edu.ph\nBen Reyes\tben@pcc.edu.ph\ncara@pcc.edu.ph, Cara Lim\nnot-a-row";

        $this->actingAs($this->adviser)
            ->post(route('adviser.cohorts.members.bulk', $this->cohort->id), ['rows' => $rows])
            ->assertRedirect();

        $this->assertSame(3, CohortMember::where('cohort_id', $this->cohort->id)->count());
        foreach (['ana@pcc.edu.ph', 'ben@pcc.edu.ph', 'cara@pcc.edu.ph'] as $email) {
            $this->assertDatabaseHas('cohort_members', ['email' => $email, 'status' => 'invited']);
        }
        // Names survive whichever column order the spreadsheet used.
        $this->assertDatabaseHas('cohort_members', ['email' => 'cara@pcc.edu.ph', 'full_name' => 'Cara Lim']);
    }

    /** @test */
    public function only_the_owning_adviser_can_view_a_cohort(): void
    {
        $otherAdviser = User::factory()->create([
            'role_id' => Role::where('name', 'adviser')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($otherAdviser)
            ->get(route('adviser.cohorts.show', $this->cohort->id))
            ->assertForbidden();
    }

    private function assertRejected(string $expectedState): void
    {
        $this->get(route('join.cohort', $this->cohort->join_code))->assertInertia(fn($page) => $page
            ->component('Join/Cohort')
            ->where('state', $expectedState));

        $this->post(route('join.cohort.store', $this->cohort->join_code), $this->joinPayload())
            ->assertSessionHasErrors('email');

        $this->assertDatabaseMissing('users', ['email' => 'ana.cruz@pcc.edu.ph']);
    }
}
