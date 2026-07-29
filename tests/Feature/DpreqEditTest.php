<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Dpreq\Jobs\GenerateDpreqFormPdfJob;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// Stakeholder 2026-07-28 — editing a Form-1 field regenerates the Form 1 PDF; a no-op save doesn't.
class DpreqEditTest extends TestCase
{
    use RefreshDatabase;

    private User $researcher;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->seed(RoleSeeder::class);
        $this->researcher = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    private function returnedApplication(): \App\Modules\Dpreq\Models\DpreqApplication
    {
        Auth::onceUsingId($this->researcher->id);
        $dpreq = app(ResearchApplicationService::class)->submitForm1([
            'research_title' => 'Original Title',
            'researcher_count' => 1,
            'adviser_name' => 'Adam Adviser',
            'applicant_category' => 'student',
            'department' => 'CCS',
            'respondents' => 'Students',
            'target_respondent_count' => 50,
            'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form',
            'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonths(3)->toDateString(),
            'minors_involved' => false,
            'respondent_head_letter_approved' => true,
            'applicant_type' => 'internal_researcher',
            'review_checklist' => [
                'voluntary_participation' => 'yes',
                'confidentiality' => 'yes',
                'free_withdrawal' => 'yes',
                'avoid_harm' => 'yes',
                'academic_use_only' => 'yes',
            ],
            'purpose' => 'Academic research.',
            'data_types' => ['survey_responses'],
            'data_subjects' => ['students'],
            'retention_plan' => 'Two years.',
            'third_party_sharing' => false,
            'study_type' => 'thesis_dissertation',
            'study_design' => 'quantitative',
            'study_sites' => 'PCC',
            'target_population' => 'PCC students',
            'participant_count' => 50,
            'inclusion_criteria' => 'Enrolled.',
            'exclusion_criteria' => 'Minors.',
            'vulnerable_population' => false,
            'risks_to_participants' => 'Minimal.',
            'benefits' => 'Research.',
            'confidentiality_measures' => 'Anonymised.',
            'consent_process' => 'Informed consent.',
            'data_storage_plan' => 'Encrypted.',
        ], $this->researcher);

        // Simulate a return-for-correction so the applicant may edit.
        $dpreq->update(['status' => 'returned']);

        return $dpreq;
    }

    private function editPayload(array $overrides = []): array
    {
        return array_merge([
            'research_title' => 'Original Title',
            'adviser_name' => 'Adam Adviser',
            'applicant_category' => 'student',
            'department' => 'CCS',
            'respondents' => 'Students',
            'target_respondent_count' => 50,
            'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form',
            'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonths(3)->toDateString(),
            'minors_involved' => false,
            'respondent_head_letter_approved' => true,
            'review_checklist' => [
                'voluntary_participation' => 'yes',
                'confidentiality' => 'yes',
                'free_withdrawal' => 'yes',
                'avoid_harm' => 'yes',
                'academic_use_only' => 'yes',
            ],
            'purpose' => 'Academic research.',
            'data_types' => ['survey_responses'],
            'data_subjects' => ['students'],
            'retention_plan' => 'Two years.',
            'third_party_sharing' => false,
        ], $overrides);
    }

    /** @test */
    public function editing_a_form1_field_regenerates_the_form1_pdf(): void
    {
        $dpreq = $this->returnedApplication();
        Bus::fake();

        $this->actingAs($this->researcher)
            ->put(route('dpreq.update', $dpreq->id), $this->editPayload(['research_title' => 'Updated Title']))
            ->assertRedirect(route('dpreq.show', $dpreq->id));

        $this->assertSame('Updated Title', $dpreq->researchApplication->fresh()->research_title);
        Bus::assertDispatched(GenerateDpreqFormPdfJob::class);
    }

    /** @test */
    public function a_no_op_save_does_not_regenerate_the_form1_pdf(): void
    {
        $dpreq = $this->returnedApplication();
        Bus::fake();

        $this->actingAs($this->researcher)
            ->put(route('dpreq.update', $dpreq->id), $this->editPayload())
            ->assertRedirect();

        Bus::assertNotDispatched(GenerateDpreqFormPdfJob::class);
    }

    /** @test */
    public function a_non_owner_cannot_edit(): void
    {
        $dpreq = $this->returnedApplication();
        $other = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($other)
            ->put(route('dpreq.update', $dpreq->id), $this->editPayload(['research_title' => 'Hijack']))
            ->assertForbidden();
    }
}
