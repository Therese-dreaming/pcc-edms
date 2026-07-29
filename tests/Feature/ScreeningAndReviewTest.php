<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Remis\Jobs\GenerateDeficiencyNoticeJob;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Models\ReviewAssignment;
use App\Modules\Remis\Services\RemisWorkflowService;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

// FRS §VI administrative screening (checklist + deficiency notice) and §VIII seven-criteria review.
class ScreeningAndReviewTest extends TestCase
{
    use RefreshDatabase;

    private RemisApplication $application;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->seed(RoleSeeder::class);

        $applicant = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
        ]);

        $ra = ResearchApplication::create([
            'applicant_id' => $applicant->id,
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
            'applicant_id' => $applicant->id,
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
            'status' => 'for_screening',
        ]);
    }

    /** @test */
    public function an_incomplete_screening_persists_the_checklist_and_generates_a_deficiency_notice(): void
    {
        Queue::fake();
        $secretariat = User::factory()->create(['role_id' => Role::where('name', 'ethics_secretariat')->value('id'), 'account_status' => 'active']);

        $this->actingAs($secretariat);
        app(RemisWorkflowService::class)->screen(
            $this->application,
            'incomplete',
            'Instrument was not attached.',
            [
                'proposal_attached' => true,
                'consent_form_attached' => true,
                'instrument_attached' => false,
                'signatures_complete' => true,
                'required_templates_used' => false,
            ],
            $secretariat->id,
        );

        $this->assertDatabaseHas('screening_checklists', [
            'remis_application_id' => $this->application->id,
            'decision' => 'incomplete',
            'instrument_attached' => false,
            'required_templates_used' => false,
            'screened_by' => $secretariat->id,
        ]);
        $this->assertSame('for_revision', $this->application->fresh()->status);

        Queue::assertPushed(GenerateDeficiencyNoticeJob::class);
    }

    /** @test */
    public function a_complete_screening_advances_to_review_without_a_deficiency_notice(): void
    {
        Queue::fake();
        $secretariat = User::factory()->create(['role_id' => Role::where('name', 'ethics_secretariat')->value('id'), 'account_status' => 'active']);

        $this->actingAs($secretariat);
        app(RemisWorkflowService::class)->screen(
            $this->application,
            'complete',
            null,
            array_fill_keys(['proposal_attached', 'consent_form_attached', 'instrument_attached', 'signatures_complete', 'required_templates_used'], true),
            $secretariat->id,
        );

        $this->assertSame('for_review', $this->application->fresh()->status);
        Queue::assertNotPushed(GenerateDeficiencyNoticeJob::class);
    }

    /** @test */
    public function the_deficiency_notice_is_actually_rendered_and_stored(): void
    {
        // No Queue::fake here — let the job run so the PDF is genuinely produced.
        $secretariat = User::factory()->create(['role_id' => Role::where('name', 'ethics_secretariat')->value('id'), 'account_status' => 'active']);

        $this->actingAs($secretariat);
        app(RemisWorkflowService::class)->screen(
            $this->application, 'returned_for_compliance', 'Missing signatures.',
            ['proposal_attached' => true, 'consent_form_attached' => true, 'instrument_attached' => true, 'signatures_complete' => false, 'required_templates_used' => true],
            $secretariat->id,
        );

        $this->assertDatabaseHas('documents', [
            'documentable_type' => $this->application->getMorphClass(),
            'documentable_id' => $this->application->id,
            'document_type' => 'DeficiencyNotice',
        ]);
    }

    /** @test */
    public function submitting_a_review_persists_all_seven_criteria(): void
    {
        $reviewer = User::factory()->create(['role_id' => Role::where('name', 'ethics_reviewer')->value('id'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->application->update(['status' => 'for_review']);
        $assignment = ReviewAssignment::create([
            'remis_application_id' => $this->application->id,
            'reviewer_id' => $reviewer->id,
            'assigned_at' => now(),
        ]);

        $criteria = [];
        foreach (['voluntary_participation', 'informed_consent', 'protection_from_harm', 'confidentiality', 'participant_selection', 'privacy_protection', 'ethical_acceptability'] as $c) {
            $criteria[$c] = ['verdict' => $c === 'confidentiality' ? 'concerns' : 'met', 'comment' => null];
        }

        $this->actingAs($reviewer)->post(route('remis.submit-review', $this->application->id), [
            'risk_level' => 'minimal',
            'rationale' => 'Low risk survey.',
            'recommendation' => 'approve',
            'comments' => 'Looks fine overall.',
            'criteria' => $criteria,
        ])->assertRedirect();

        $this->assertSame(7, $assignment->criteriaAssessments()->count());
        $this->assertDatabaseHas('review_criteria_assessments', [
            'review_assignment_id' => $assignment->id,
            'criterion' => 'confidentiality',
            'verdict' => 'concerns',
        ]);
    }
}
