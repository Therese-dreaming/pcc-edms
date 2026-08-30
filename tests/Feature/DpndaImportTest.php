<?php

namespace Tests\Feature;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

// Roadmap A3 (2026-08-31) — coordinator batch onboarding via CSV: preview validates every row
// without persisting; confirm creates placements + draft NDAs and invites unknown trainees.
class DpndaImportTest extends TestCase
{
    use RefreshDatabase;

    private User $coordinator;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->seed(RoleSeeder::class);

        $this->coordinator = User::factory()->create([
            'role_id' => Role::where('name', 'department_coordinator')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    private function csv(): string
    {
        return implode("\n", [
            'trainee_email,trainee_last_name,trainee_first_name,enrolled_school,trainee_type,department_assigned,start_date,end_date,age',
            'juan@example.test,Dela Cruz,Juan,PCC,internal_ojt,Registrar,2026-09-01,2026-12-01,21',
            'maria@example.test,Santos,Maria,Other University,external_ojt,Library,2026-09-01,2026-11-15,22',
            'bad@example.test,Row,Bad,PCC,not_a_type,Registrar,2026-09-01,2026-12-01,',
        ]);
    }

    /** @test */
    public function preview_validates_rows_without_persisting(): void
    {
        $this->actingAs($this->coordinator)
            ->post(route('dpnda.import.preview'), [
                'file' => UploadedFile::fake()->createWithContent('trainees.csv', $this->csv()),
            ])
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Dpnda/Import')
                ->has('preview', 3)
                ->where('preview.0.valid', true)
                ->where('preview.2.valid', false));

        $this->assertDatabaseCount('placements', 0);
        $this->assertDatabaseCount('dpnda_records', 0);
    }

    /** @test */
    public function confirm_creates_placements_and_invites_unknown_trainees(): void
    {
        $this->actingAs($this->coordinator)
            ->post(route('dpnda.import.preview'), [
                'file' => UploadedFile::fake()->createWithContent('trainees.csv', $this->csv()),
            ]);

        $response = $this->post(route('dpnda.import.confirm'));

        $response->assertRedirect(route('dpnda.index'));

        $this->assertDatabaseCount('placements', 2);
        $this->assertDatabaseCount('dpnda_records', 2);
        $this->assertDatabaseHas('users', ['email' => 'juan@example.test']);
        $this->assertDatabaseHas('users', ['email' => 'maria@example.test']);
        $this->assertDatabaseMissing('users', ['email' => 'bad@example.test']);

        $juan = User::where('email', 'juan@example.test')->first();
        $this->assertSame(
            Role::where('name', 'ojt_trainee_internal')->value('id'),
            $juan->role_id,
        );
    }

    /** @test */
    public function confirm_without_a_preview_is_rejected(): void
    {
        $this->actingAs($this->coordinator)
            ->post(route('dpnda.import.confirm'))
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('placements', 0);
    }

    /** @test */
    public function only_coordinators_can_import(): void
    {
        $researcher = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($researcher)
            ->get(route('dpnda.import'))
            ->assertForbidden();
    }
}
