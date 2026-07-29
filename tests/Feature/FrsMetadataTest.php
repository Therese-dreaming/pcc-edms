<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Remis\Models\Decision;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Auth\Models\Role;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// FRS §XV document `Status` metadata and §XVII administrator summary dashboard.
class FrsMetadataTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function makeApplication(string $status): RemisApplication
    {
        $applicant = User::factory()->create(['role_id' => Role::where('name', 'researcher_internal')->value('id')]);
        $ra = ResearchApplication::create([
            'applicant_id' => $applicant->id, 'research_title' => 'S', 'adviser_name' => 'A', 'department' => 'CCS',
            'respondents' => 'x', 'target_respondent_count' => 10, 'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form', 'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonth()->toDateString(),
        ]);

        return RemisApplication::create([
            'research_application_id' => $ra->id, 'tracking_number' => 'REC-'.uniqid(), 'applicant_id' => $applicant->id,
            'study_type' => 'thesis_dissertation', 'study_design' => 'quantitative', 'target_population' => 'x',
            'participant_count' => 10, 'inclusion_criteria' => 'x', 'exclusion_criteria' => 'x', 'study_sites' => 'x',
            'risks_to_participants' => 'x', 'benefits' => 'x', 'confidentiality_measures' => 'x',
            'consent_process' => 'x', 'data_storage_plan' => 'x', 'status' => $status,
        ]);
    }

    /** @test */
    public function a_document_exposes_a_status_derived_from_its_version_and_archival_state(): void
    {
        $app = $this->makeApplication('for_review');
        $base = ['documentable_type' => $app->getMorphClass(), 'documentable_id' => $app->id, 'document_type' => 'X', 'file_path' => 'p', 'original_filename' => 'o', 'mime_type' => 'application/pdf', 'size_bytes' => 1, 'uploaded_by' => $app->applicant_id];

        $current = Document::create([...$base, 'version' => 2, 'is_current_version' => true]);
        $superseded = Document::create([...$base, 'version' => 1, 'is_current_version' => false]);
        $archived = Document::create([...$base, 'version' => 0, 'is_current_version' => false, 'archived_at' => now()]);

        $this->assertSame('current', $current->status);
        $this->assertSame('superseded', $superseded->status);
        $this->assertSame('archived', $archived->status);

        // The derived status is serialized (appended) for the frontend.
        $this->assertArrayHasKey('status', $current->toArray());
    }

    /** @test */
    public function the_admin_summary_reports_the_frs_metrics(): void
    {
        // 2 approved, 1 disapproved, plus 1 still pending.
        $a1 = $this->makeApplication('approved');
        $a2 = $this->makeApplication('approved_with_conditions');
        $a3 = $this->makeApplication('disapproved');
        $this->makeApplication('for_review'); // pending

        $chair = User::factory()->create(['role_id' => Role::where('name', 'ethics_committee_chair')->value('id')]);
        foreach ([[$a1, 'approved'], [$a2, 'approved_with_conditions'], [$a3, 'disapproved']] as [$app, $outcome]) {
            Decision::create(['remis_application_id' => $app->id, 'outcome' => $outcome, 'decided_by' => $chair->id, 'decision_date' => now()->toDateString()]);
        }

        $admin = User::factory()->create(['role_id' => Role::where('name', 'system_administrator')->value('id'), 'account_status' => 'active', 'email_verified_at' => now()]);

        $this->actingAs($admin)->get(route('dashboard'))->assertInertia(fn ($p) => $p
            ->where('adminSummary.total', 4)
            ->where('adminSummary.pending_reviews', 1)
            ->where('adminSummary.approved', 2)
            ->where('adminSummary.disapproved', 1));
    }

    /** @test */
    public function non_admins_get_no_admin_summary(): void
    {
        $researcher = User::factory()->create(['role_id' => Role::where('name', 'researcher_internal')->value('id'), 'account_status' => 'active', 'email_verified_at' => now()]);

        $this->actingAs($researcher)->get(route('dashboard'))->assertInertia(fn ($p) => $p->where('adminSummary', null));
    }
}
