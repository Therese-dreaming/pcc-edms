<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// 2026-08-31 audit — docs/HANDOFF.md Part L shipped auto-pause-on-breach with a
// resumeMonitoring() service method but no route, controller action, or UI path — a dead-end
// status. This covers the wired-up route and its applicant-only authorization.
class MonitoringResumeTest extends TestCase
{
    use RefreshDatabase;

    private RemisApplication $application;

    private User $applicant;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->seed(RoleSeeder::class);

        $this->applicant = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $ra = ResearchApplication::create([
            'applicant_id' => $this->applicant->id,
            'research_title' => 'A Study',
            'adviser_name' => 'Adam',
            'department' => 'CCS',
            'respondents' => 'Students',
            'target_respondent_count' => 50,
            'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form',
            'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonths(3)->toDateString(),
        ]);

        $this->application = RemisApplication::create([
            'research_application_id' => $ra->id,
            'tracking_number' => 'REC-2026-0001',
            'applicant_id' => $this->applicant->id,
            'study_type' => 'thesis_dissertation',
            'study_design' => 'quantitative',
            'target_population' => 'Students',
            'participant_count' => 50,
            'inclusion_criteria' => 'Enrolled.',
            'exclusion_criteria' => 'Minors.',
            'study_sites' => 'PCC',
            'risks_to_participants' => 'Minimal.',
            'benefits' => 'Research.',
            'confidentiality_measures' => 'Anon.',
            'consent_process' => 'Consent.',
            'data_storage_plan' => 'Encrypted.',
            'status' => 'monitoring_paused',
        ]);
    }

    /** @test */
    public function the_applicant_can_resume_paused_monitoring(): void
    {
        $this->actingAs($this->applicant)
            ->post(route('remis.resume-monitoring', $this->application->id))
            ->assertRedirect();

        $this->assertSame('monitoring', $this->application->fresh()->status);
    }

    /** @test */
    public function another_user_cannot_resume_paused_monitoring(): void
    {
        $stranger = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($stranger)
            ->post(route('remis.resume-monitoring', $this->application->id))
            ->assertForbidden();

        $this->assertSame('monitoring_paused', $this->application->fresh()->status);
    }
}
