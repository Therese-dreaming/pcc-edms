<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// REMIS register bulk Actions (index Actions menu). Mirrors the DPREQ register behaviour.
class RemisRegisterActionsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function user(string $role): User
    {
        return User::factory()->create(['role_id' => Role::where('name', $role)->value('id'), 'account_status' => 'active', 'email_verified_at' => now()]);
    }

    private function application(User $applicant, string $status = 'for_review', string $tracking = 'REC-7001'): RemisApplication
    {
        $ra = ResearchApplication::create([
            'applicant_id' => $applicant->id, 'research_title' => 'S', 'adviser_name' => 'A',
            'respondents' => 'x', 'target_respondent_count' => 10, 'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form', 'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonth()->toDateString(),
        ]);

        return RemisApplication::create([
            'research_application_id' => $ra->id, 'tracking_number' => $tracking, 'applicant_id' => $applicant->id,
            'study_type' => 'thesis_dissertation', 'study_design' => 'quantitative', 'target_population' => 'x',
            'participant_count' => 10, 'inclusion_criteria' => 'x', 'exclusion_criteria' => 'x', 'study_sites' => 'x',
            'risks_to_participants' => 'x', 'benefits' => 'x', 'confidentiality_measures' => 'x',
            'consent_process' => 'x', 'data_storage_plan' => 'x', 'status' => $status,
        ]);
    }

    /** @test */
    public function secretariat_archives_and_it_leaves_the_register(): void
    {
        $applicant = $this->user('researcher_internal');
        $secretariat = $this->user('ethics_secretariat');
        $a = $this->application($applicant);

        $this->actingAs($secretariat)->post(route('remis.bulk-archive'), ['ids' => [$a->id]])->assertRedirect();

        $this->assertNotNull($a->fresh()->archived_at);
        $this->assertDatabaseHas('audit_log', ['event_type' => 'remis_application.archived']);
        $this->actingAs($secretariat)->get(route('remis.index'))->assertInertia(fn ($p) => $p
            ->where('applications.data', fn ($rows) => collect($rows)->doesntContain('id', $a->id)));
    }

    /** @test */
    public function only_an_admin_can_delete_a_reviewed_application(): void
    {
        $applicant = $this->user('researcher_internal');
        $secretariat = $this->user('ethics_secretariat');
        $admin = $this->user('system_administrator');
        $a = $this->application($applicant, 'for_review', 'REC-7002');

        $this->actingAs($secretariat)->delete(route('remis.bulk-destroy'), ['ids' => [$a->id]])->assertRedirect();
        $this->assertNull($a->fresh()->deleted_at);

        $this->actingAs($admin)->delete(route('remis.bulk-destroy'), ['ids' => [$a->id]])->assertRedirect();
        $this->assertSoftDeleted('remis_applications', ['id' => $a->id]);
    }
}
