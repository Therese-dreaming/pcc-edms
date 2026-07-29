<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// DPREQ register bulk Actions (index Actions menu): archive removes from the register but keeps
// the record; delete soft-deletes; both are authorized per-record.
class DpreqRegisterActionsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function application(User $applicant, string $status = 'submitted', string $tracking = 'DPREQ-2026-7001'): DpreqApplication
    {
        $ra = ResearchApplication::create([
            'applicant_id' => $applicant->id, 'research_title' => 'S', 'adviser_name' => 'A',
            'respondents' => 'x', 'target_respondent_count' => 10, 'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form', 'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonth()->toDateString(),
        ]);

        return DpreqApplication::create([
            'research_application_id' => $ra->id, 'tracking_number' => $tracking, 'applicant_id' => $applicant->id,
            'applicant_type' => 'internal_researcher', 'purpose' => 'R', 'data_types' => ['x'], 'data_subjects' => ['s'],
            'retention_plan' => 'x', 'status' => $status,
        ]);
    }

    private function user(string $role): User
    {
        return User::factory()->create(['role_id' => Role::where('name', $role)->value('id'), 'account_status' => 'active', 'email_verified_at' => now()]);
    }

    /** @test */
    public function dpo_can_archive_selected_and_they_leave_the_register(): void
    {
        $applicant = $this->user('researcher_internal');
        $dpo = $this->user('dpo_staff');
        $a = $this->application($applicant, 'under_review', 'DPREQ-2026-7001');

        $this->actingAs($dpo)->post(route('dpreq.bulk-archive'), ['ids' => [$a->id]])->assertRedirect();

        $this->assertNotNull($a->fresh()->archived_at);
        $this->assertDatabaseHas('audit_log', ['event_type' => 'dpreq_application.archived']);

        // Archived record no longer appears in the register listing.
        $this->actingAs($dpo)->get(route('dpreq.index'))->assertInertia(fn ($p) => $p
            ->where('applications.data', fn ($rows) => collect($rows)->doesntContain('id', $a->id)));
    }

    /** @test */
    public function only_an_admin_can_delete_someone_elses_application(): void
    {
        $applicant = $this->user('researcher_internal');
        $dpo = $this->user('dpo_staff');
        $admin = $this->user('system_administrator');
        $a = $this->application($applicant, 'under_review', 'DPREQ-2026-7002');

        // DPO cannot delete (only archive); the record survives.
        $this->actingAs($dpo)->delete(route('dpreq.bulk-destroy'), ['ids' => [$a->id]])->assertRedirect();
        $this->assertNull($a->fresh()->deleted_at);

        // Admin can — it is soft-deleted.
        $this->actingAs($admin)->delete(route('dpreq.bulk-destroy'), ['ids' => [$a->id]])->assertRedirect();
        $this->assertSoftDeleted('dpreq_applications', ['id' => $a->id]);
    }

    /** @test */
    public function an_applicant_may_archive_only_their_own_draft(): void
    {
        $applicant = $this->user('researcher_internal');
        $other = $this->user('researcher_internal');
        $draft = $this->application($applicant, 'draft', 'DPREQ-2026-7003');
        $submitted = $this->application($applicant, 'submitted', 'DPREQ-2026-7004');
        $foreign = $this->application($other, 'draft', 'DPREQ-2026-7005');

        $this->actingAs($applicant)->post(route('dpreq.bulk-archive'), ['ids' => [$draft->id, $submitted->id, $foreign->id]])->assertRedirect();

        $this->assertNotNull($draft->fresh()->archived_at);   // own draft — allowed
        $this->assertNull($submitted->fresh()->archived_at);  // own but past draft — refused
        $this->assertNull($foreign->fresh()->archived_at);    // someone else's — refused
    }
}
