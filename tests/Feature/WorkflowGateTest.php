<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Models\ReviewAssignment;
use App\Modules\Remis\Services\RemisWorkflowService;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use App\Shared\Revisions\Services\RevisionService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

// 2026-08-31 audit — the status gates around reviewer assignment and review submission, and the
// revision-request double-close guard.
class WorkflowGateTest extends TestCase
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
            'status' => 'for_review',
        ]);
    }

    /** @test */
    public function reviewers_can_only_be_assigned_while_for_review(): void
    {
        $this->application->update(['status' => 'for_screening']);
        $reviewer = User::factory()->create([
            'role_id' => Role::where('name', 'ethics_reviewer')->value('id'),
        ]);

        $this->expectException(RuntimeException::class);

        app(RemisWorkflowService::class)->assignReviewer($this->application->fresh(), $reviewer->id);
    }

    /** @test */
    public function reviews_can_only_be_submitted_while_for_review(): void
    {
        $reviewer = User::factory()->create([
            'role_id' => Role::where('name', 'ethics_reviewer')->value('id'),
        ]);

        $assignment = ReviewAssignment::create([
            'remis_application_id' => $this->application->id,
            'reviewer_id' => $reviewer->id,
            'assigned_at' => now(),
        ]);

        $this->application->update(['status' => 'for_revision']);

        $this->expectException(RuntimeException::class);

        app(RemisWorkflowService::class)->classifyRiskAndRecommend(
            $assignment->fresh(), 'minimal', 'Low risk.', 'approve', 'No concerns.',
        );
    }

    /** @test */
    public function a_resolved_revision_request_cannot_be_resolved_or_waived_again(): void
    {
        $staff = User::factory()->create([
            'role_id' => Role::where('name', 'ethics_secretariat')->value('id'),
        ]);
        $service = app(RevisionService::class);

        $request = $service->raise($this->application, $staff, 'Please clarify the consent process.', $this->applicant);
        $service->resolve($request, $staff);

        try {
            $service->resolve($request->fresh(), $staff);
            $this->fail('Resolving an already-resolved request should throw.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('already closed', $e->getMessage());
        }

        try {
            $service->waive($request->fresh(), $staff);
            $this->fail('Waiving an already-resolved request should throw.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('already closed', $e->getMessage());
        }
    }
}
