<?php

namespace Tests\Feature;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// 3.1 nav module-access map (item 2) and 3.2 OJT invite-at-placement for account-less trainees (item 3).
class Phase3AccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->seed(RoleSeeder::class);
    }

    private function userWith(string $role): User
    {
        return User::factory()->create([
            'role_id' => Role::where('name', $role)->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    /** @test */
    public function the_module_access_map_is_scoped_per_role(): void
    {
        // A researcher sees DPREQ + REMIS + Incidents, but not DPNDA.
        $this->actingAs($this->userWith('researcher_internal'))->get(route('dashboard'))
            ->assertInertia(fn ($p) => $p
                ->where('can.dpreq', true)->where('can.remis', true)
                ->where('can.incidents', true)->where('can.dpnda', false));

        // A trainee sees only DPNDA.
        $this->actingAs($this->userWith('ojt_trainee_internal'))->get(route('dashboard'))
            ->assertInertia(fn ($p) => $p
                ->where('can.dpnda', true)->where('can.dpreq', false)
                ->where('can.remis', false)->where('can.incidents', false));

        // An adviser (endorser) sees REMIS but not DPNDA/DPREQ.
        $this->actingAs($this->userWith('adviser'))->get(route('dashboard'))
            ->assertInertia(fn ($p) => $p
                ->where('can.remis', true)->where('can.dpnda', false)->where('can.dpreq', false));

        // An admin sees everything.
        $this->actingAs($this->userWith('system_administrator'))->get(route('dashboard'))
            ->assertInertia(fn ($p) => $p
                ->where('can.dpreq', true)->where('can.dpnda', true)
                ->where('can.remis', true)->where('can.incidents', true));
    }

    /** @test */
    public function hiding_nav_is_not_the_security_boundary(): void
    {
        // A trainee has no DPREQ nav, but hitting DPREQ directly is still gated by policy (they may
        // view their own list — the point is the module enforces its own access, not the nav).
        $this->actingAs($this->userWith('ojt_trainee_internal'))
            ->get(route('dpreq.index'))
            ->assertSuccessful(); // scoped to their own (empty) list; not a 500/route error
    }

    /** @test */
    public function creating_a_placement_for_an_unknown_email_invites_the_trainee(): void
    {
        $coordinator = $this->userWith('department_coordinator');

        $payload = [
            'trainee_email' => 'transferee@example.com',
            'trainee_last_name' => 'Transferee',
            'trainee_first_name' => 'Tanya',
            'enrolled_school' => 'Some University',
            'trainee_type' => 'external_ojt',
            'department_assigned' => 'IT Office',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(2)->toDateString(),
        ];

        $this->actingAs($coordinator)->post(route('dpnda.store'), $payload)->assertRedirect();

        // A new trainee account was created with the OJT role, and the placement points at it.
        $trainee = User::where('email', 'transferee@example.com')->first();
        $this->assertNotNull($trainee);
        $this->assertSame('ojt_trainee_external', $trainee->role->name);
        $this->assertSame('pending_validation', $trainee->account_status);
        $this->assertDatabaseHas('placements', [
            'trainee_id' => $trainee->id,
            'trainee_first_name' => 'Tanya',
        ]);
    }

    /** @test */
    public function creating_a_placement_for_an_existing_trainee_reuses_the_account(): void
    {
        $coordinator = $this->userWith('department_coordinator');
        $existing = User::factory()->create(['email' => 'already@example.com', 'role_id' => Role::where('name', 'ojt_trainee_internal')->value('id'), 'account_status' => 'active']);

        $payload = [
            'trainee_email' => 'already@example.com',
            'trainee_last_name' => 'Existing', 'trainee_first_name' => 'Ed',
            'enrolled_school' => 'PCC', 'trainee_type' => 'internal_ojt',
            'department_assigned' => 'Library',
            'start_date' => now()->toDateString(), 'end_date' => now()->addMonths(2)->toDateString(),
        ];

        $this->actingAs($coordinator)->post(route('dpnda.store'), $payload)->assertRedirect();

        // No duplicate account created.
        $this->assertSame(1, User::where('email', 'already@example.com')->count());
        $this->assertDatabaseHas('placements', ['trainee_id' => $existing->id]);
    }
}
