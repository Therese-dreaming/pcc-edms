<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Dpnda\Models\Placement;
use App\Modules\Dpnda\Models\TraineeSchedule;
use App\Shared\Auth\Models\Role;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Trainee self-service weekly whereabouts (trainee_schedules) plus the deployment calendar that
// visualizes them. Covers the trainee CRUD happy path, the ownership guards, the validation rules,
// and the role-based scoping on both the schedules index and the calendar.
class DpndaScheduleTest extends TestCase
{
    use RefreshDatabase;

    private User $coordinator;
    private User $trainee;
    private User $otherTrainee;
    private User $dpo;
    private Placement $placement;
    private Placement $otherPlacement;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        $role = fn (string $name) => Role::where('name', $name)->value('id');

        $this->coordinator = User::factory()->create(['role_id' => $role('department_coordinator')]);
        $this->trainee = User::factory()->create(['role_id' => $role('ojt_trainee_internal')]);
        $this->otherTrainee = User::factory()->create(['role_id' => $role('ojt_trainee_external')]);
        $this->dpo = User::factory()->create(['role_id' => $role('dpo_staff')]);

        $this->placement = $this->makePlacement($this->trainee, $this->coordinator);
        $this->otherPlacement = $this->makePlacement($this->otherTrainee, $this->coordinator);
    }

    private function makePlacement(User $trainee, User $coordinator, array $overrides = []): Placement
    {
        return Placement::create(array_merge([
            'trainee_id' => $trainee->id,
            'trainee_last_name' => 'Doe',
            'trainee_first_name' => $trainee->name,
            'enrolled_school' => 'PCC',
            'trainee_type' => 'internal_ojt',
            'department_assigned' => 'Records Office',
            'start_date' => now()->subWeek()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'coordinator_id' => $coordinator->id,
        ], $overrides));
    }

    private function blockPayload(array $overrides = []): array
    {
        return array_merge([
            'placement_id' => $this->placement->id,
            'day_of_week' => 1,
            'start_time' => '08:00',
            'end_time' => '17:00',
            'location' => 'Records Office',
            'notes' => 'Assist with encoding',
        ], $overrides);
    }

    /** @test */
    public function a_trainee_can_add_a_block_to_their_own_placement(): void
    {
        $this->actingAs($this->trainee)
            ->post(route('dpnda.schedules.store'), $this->blockPayload())
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('trainee_schedules', [
            'placement_id' => $this->placement->id,
            'day_of_week' => 1,
            'location' => 'Records Office',
        ]);
    }

    /** @test */
    public function a_trainee_can_update_and_delete_their_own_block(): void
    {
        $block = TraineeSchedule::create($this->blockPayload(['notes' => null]));

        $this->actingAs($this->trainee)
            ->put(route('dpnda.schedules.update', $block), $this->blockPayload([
                'day_of_week' => 3,
                'start_time' => '09:00',
                'end_time' => '12:00',
                'location' => 'Library',
            ]))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('trainee_schedules', [
            'id' => $block->id,
            'day_of_week' => 3,
            'location' => 'Library',
        ]);

        $this->actingAs($this->trainee)
            ->delete(route('dpnda.schedules.destroy', $block))
            ->assertRedirect();

        $this->assertDatabaseMissing('trainee_schedules', ['id' => $block->id]);
    }

    /** @test */
    public function a_trainee_cannot_add_a_block_to_someone_elses_placement(): void
    {
        $this->actingAs($this->trainee)
            ->post(route('dpnda.schedules.store'), $this->blockPayload([
                'placement_id' => $this->otherPlacement->id,
            ]))
            ->assertForbidden();

        $this->assertDatabaseMissing('trainee_schedules', ['placement_id' => $this->otherPlacement->id]);
    }

    /** @test */
    public function a_trainee_cannot_update_or_delete_someone_elses_block(): void
    {
        $block = TraineeSchedule::create($this->blockPayload([
            'placement_id' => $this->otherPlacement->id,
        ]));

        $this->actingAs($this->trainee)
            ->put(route('dpnda.schedules.update', $block), $this->blockPayload(['location' => 'Hacked']))
            ->assertForbidden();

        $this->actingAs($this->trainee)
            ->delete(route('dpnda.schedules.destroy', $block))
            ->assertForbidden();

        $this->assertDatabaseHas('trainee_schedules', ['id' => $block->id, 'location' => 'Records Office']);
    }

    /** @test */
    public function a_block_requires_a_real_placement(): void
    {
        // A trainee with no placement of their own cannot point a block at a placement that
        // doesn't exist (or, by the ownership guard above, at one that isn't theirs).
        $this->actingAs($this->trainee)
            ->from(route('dpnda.schedules.index'))
            ->post(route('dpnda.schedules.store'), $this->blockPayload(['placement_id' => 999999]))
            ->assertSessionHasErrors('placement_id');

        $this->assertDatabaseCount('trainee_schedules', 0);
    }

    /** @test */
    public function day_of_week_must_be_between_zero_and_six(): void
    {
        $this->actingAs($this->trainee)
            ->from(route('dpnda.schedules.index'))
            ->post(route('dpnda.schedules.store'), $this->blockPayload(['day_of_week' => 7]))
            ->assertSessionHasErrors('day_of_week');

        $this->actingAs($this->trainee)
            ->from(route('dpnda.schedules.index'))
            ->post(route('dpnda.schedules.store'), $this->blockPayload(['day_of_week' => -1]))
            ->assertSessionHasErrors('day_of_week');
    }

    /** @test */
    public function end_time_must_be_after_start_time(): void
    {
        $this->actingAs($this->trainee)
            ->from(route('dpnda.schedules.index'))
            ->post(route('dpnda.schedules.store'), $this->blockPayload([
                'start_time' => '17:00',
                'end_time' => '08:00',
            ]))
            ->assertSessionHasErrors('end_time');
    }

    /** @test */
    public function the_schedules_index_is_scoped_by_role(): void
    {
        $mine = TraineeSchedule::create($this->blockPayload());
        $others = TraineeSchedule::create($this->blockPayload([
            'placement_id' => $this->otherPlacement->id,
            'location' => 'Clinic',
        ]));

        // Trainee sees only their own blocks (and gets their placement for the self-service UI).
        $this->actingAs($this->trainee)->get(route('dpnda.schedules.index'))->assertInertia(fn ($p) => $p
            ->where('schedules', fn ($rows) => collect($rows)->pluck('id')->all() === [$mine->id])
            ->where('myPlacement.id', $this->placement->id));

        // Coordinator sees every block belonging to their trainees.
        $this->actingAs($this->coordinator)->get(route('dpnda.schedules.index'))->assertInertia(fn ($p) => $p
            ->where('schedules', fn ($rows) => collect($rows)->pluck('id')->sort()->values()->all() === collect([$mine->id, $others->id])->sort()->values()->all())
            ->where('myPlacement', null));

        // DPO sees everything.
        $this->actingAs($this->dpo)->get(route('dpnda.schedules.index'))->assertInertia(fn ($p) => $p
            ->has('schedules', 2));
    }

    /** @test */
    public function the_calendar_is_scoped_by_role(): void
    {
        $month = now()->format('Y-m');

        // Trainee sees only their own deployment.
        $this->actingAs($this->trainee)->get(route('dpnda.calendar', ['month' => $month]))->assertInertia(fn ($p) => $p
            ->where('placements', fn ($rows) => collect($rows)->pluck('id')->all() === [$this->placement->id]));

        // Coordinator sees both of their trainees' deployments.
        $this->actingAs($this->coordinator)->get(route('dpnda.calendar', ['month' => $month]))->assertInertia(fn ($p) => $p
            ->has('placements', 2));

        // DPO sees everything.
        $this->actingAs($this->dpo)->get(route('dpnda.calendar', ['month' => $month]))->assertInertia(fn ($p) => $p
            ->has('placements', 2));
    }

    /** @test */
    public function the_calendar_only_returns_placements_overlapping_the_requested_month(): void
    {
        // A deployment entirely in the past relative to the requested month is excluded.
        $this->makePlacement($this->trainee, $this->coordinator, [
            'start_date' => now()->subMonths(6)->toDateString(),
            'end_date' => now()->subMonths(5)->toDateString(),
        ]);

        $this->actingAs($this->dpo)
            ->get(route('dpnda.calendar', ['month' => now()->format('Y-m')]))
            ->assertInertia(fn ($p) => $p->has('placements', 2));

        // But it shows up when we ask for the month it actually ran in.
        $this->actingAs($this->dpo)
            ->get(route('dpnda.calendar', ['month' => now()->subMonths(6)->format('Y-m')]))
            ->assertInertia(fn ($p) => $p->has('placements', 1));
    }

    /** @test */
    public function the_calendar_includes_each_placements_weekly_blocks(): void
    {
        TraineeSchedule::create($this->blockPayload(['day_of_week' => 2, 'location' => 'Registrar']));

        $this->actingAs($this->trainee)
            ->get(route('dpnda.calendar', ['month' => now()->format('Y-m')]))
            ->assertInertia(fn ($p) => $p
                ->where('placements.0.schedules', fn ($rows) => collect($rows)->contains(
                    fn ($s) => $s['day_of_week'] === 2 && $s['location'] === 'Registrar',
                )));
    }
}
