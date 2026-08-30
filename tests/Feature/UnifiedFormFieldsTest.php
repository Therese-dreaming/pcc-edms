<?php

namespace Tests\Feature;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// Unified Form 1, Parts II–V intake fields (reqs/ July-7-2026 PDF, resolution B1 2026-08-31).
// The fields persist on the shared research_applications row and are optional — submissions that
// predate the form must keep working unchanged.
class UnifiedFormFieldsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->seed(RoleSeeder::class);
    }

    private function basePayload(): array
    {
        return [
            'research_title' => 'A Study',
            'researcher_count' => 1,
            'adviser_name' => 'Adam Adviser',
            'department' => 'College of Computer Studies',
            'respondents' => 'Students',
            'target_respondent_count' => 50,
            'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form',
            'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonths(3)->toDateString(),
            'minors_involved' => false,
            'respondent_head_letter_approved' => true,
            'applicant_type' => 'internal_researcher',
            'purpose' => 'Academic research.',
            'data_types' => ['survey_responses'],
            'data_subjects' => ['students'],
            'retention_plan' => 'Two years then disposed.',
            'third_party_sharing' => false,
            'study_type' => 'thesis_dissertation',
            'study_design' => 'quantitative',
            'study_sites' => 'PCC',
            'target_population' => 'PCC students',
            'participant_count' => 50,
            'inclusion_criteria' => 'Enrolled students.',
            'exclusion_criteria' => 'Minors.',
            'vulnerable_population' => false,
            'risks_to_participants' => 'Minimal.',
            'benefits' => 'Institutional research.',
            'confidentiality_measures' => 'Anonymised.',
            'consent_process' => 'Informed consent.',
            'data_storage_plan' => 'Encrypted.',
        ];
    }

    private function submitAsResearcher(array $payload): \App\Shared\ResearchApplications\Models\ResearchApplication
    {
        $researcher = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        Auth::onceUsingId($researcher->id);

        return app(ResearchApplicationService::class)->submitForm1($payload, $researcher)->researchApplication;
    }

    /** @test */
    public function the_unified_form_fields_persist_on_submission(): void
    {
        $ra = $this->submitAsResearcher($this->basePayload() + [
            'funding_source_type' => 'university_funded',
            'recruitment_method' => 'Class announcements',
            'target_participants' => ['students', 'faculty'],
            'ethics_checklist' => [
                'informed_consent' => 'yes',
                'voluntary_participation' => 'yes',
                'free_withdrawal' => 'yes',
                'risks_minimized' => 'yes',
                'confidentiality_protected' => 'yes',
                'vulnerable_populations' => 'no',
                'incentives_provided' => 'not_applicable',
                'deception_involved' => 'no',
            ],
            'risk_band' => 'minimal',
            'risk_band_explanation' => 'Anonymous survey only.',
            'data_classification' => 'personal_information',
            'data_storage_method' => 'Password-protected computer',
            'data_access_persons' => 'Researcher and adviser',
            'data_retention_period' => 'One year',
            'data_disposal_method' => 'secure_deletion',
        ]);

        $this->assertSame('university_funded', $ra->funding_source_type);
        $this->assertSame('Class announcements', $ra->recruitment_method);
        $this->assertSame(['students', 'faculty'], $ra->target_participants);
        $this->assertSame('yes', $ra->ethics_checklist['informed_consent']);
        $this->assertSame('minimal', $ra->risk_band);
        $this->assertSame('Anonymous survey only.', $ra->risk_band_explanation);
        $this->assertSame('personal_information', $ra->data_classification);
        $this->assertSame('Password-protected computer', $ra->data_storage_method);
        $this->assertSame('Researcher and adviser', $ra->data_access_persons);
        $this->assertSame('One year', $ra->data_retention_period);
        $this->assertSame('secure_deletion', $ra->data_disposal_method);
    }

    /** @test */
    public function a_submission_without_the_unified_fields_still_works(): void
    {
        $ra = $this->submitAsResearcher($this->basePayload());

        $this->assertNull($ra->funding_source_type);
        $this->assertNull($ra->risk_band);
        $this->assertSame([], $ra->target_participants);
        $this->assertNull($ra->data_classification);
        $this->assertDatabaseHas('dpreq_applications', ['research_application_id' => $ra->id]);
        $this->assertDatabaseHas('remis_applications', ['research_application_id' => $ra->id]);
    }

    /** @test */
    public function an_other_funding_choice_collapses_to_the_free_text(): void
    {
        $ra = $this->submitAsResearcher($this->basePayload() + [
            'funding_source_type' => 'other',
            'funding_source_type_other' => 'NGO grant',
        ]);

        $this->assertSame('NGO grant', $ra->funding_source_type);
    }
}
