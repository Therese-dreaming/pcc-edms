<?php

namespace Tests\Feature;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use App\Shared\Clearance\Jobs\GenerateRemisClearancePdfJob;
use App\Shared\Clearance\Jobs\GenerateRemisExemptionPdfJob;
use App\Shared\Clearance\Services\ClearanceService;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// Stakeholder 2026-07-28 — the Ethics track can issue a Certificate of Exemption instead of a full
// Research Ethics Clearance.
class EthicsExemptionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->seed(RoleSeeder::class);
    }

    private function newResearchApplication(): \App\Shared\ResearchApplications\Models\ResearchApplication
    {
        $researcher = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        Auth::onceUsingId($researcher->id);

        $dpreq = app(ResearchApplicationService::class)->submitForm1([
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
        ], $researcher);

        return $dpreq->researchApplication;
    }

    /** @test */
    public function an_exempted_decision_issues_an_exemption_certificate_not_a_clearance(): void
    {
        Bus::fake();
        $research = $this->newResearchApplication();
        $chair = User::factory()->create([
            'role_id' => Role::where('name', 'ethics_committee_chair')->value('id'),
        ]);

        $certificate = app(ClearanceService::class)->signEthicsTrack($research, $chair->id, exempted: true);

        $this->assertSame('exemption', $certificate->remis_certificate_kind);
        $this->assertNotNull($certificate->remis_certificate_number);
        Bus::assertDispatched(GenerateRemisExemptionPdfJob::class);
        Bus::assertNotDispatched(GenerateRemisClearancePdfJob::class);
    }

    /** @test */
    public function an_approval_still_issues_a_clearance_certificate(): void
    {
        Bus::fake();
        $research = $this->newResearchApplication();
        $chair = User::factory()->create([
            'role_id' => Role::where('name', 'ethics_committee_chair')->value('id'),
        ]);

        $certificate = app(ClearanceService::class)->signEthicsTrack($research, $chair->id);

        $this->assertSame('clearance', $certificate->remis_certificate_kind);
        Bus::assertDispatched(GenerateRemisClearancePdfJob::class);
        Bus::assertNotDispatched(GenerateRemisExemptionPdfJob::class);
    }

    /** @test */
    public function an_exempted_study_is_excused_from_monitoring(): void
    {
        Bus::fake();
        $research = $this->newResearchApplication();
        $research->remisApplication->update(['status' => 'approved']);
        $chair = User::factory()->create([
            'role_id' => Role::where('name', 'ethics_committee_chair')->value('id'),
        ]);

        app(ClearanceService::class)->signEthicsTrack($research, $chair->id, exempted: true);

        // The certificate issues, but the study rests at clearance_issued — an exempted study
        // has no monthly progress-report obligation (audit fix, 2026-08-31).
        $this->assertSame('clearance_issued', $research->remisApplication->fresh()->status);
    }

    /** @test */
    public function an_approved_study_still_enters_monitoring_after_issuance(): void
    {
        Bus::fake();
        $research = $this->newResearchApplication();
        $research->remisApplication->update(['status' => 'approved']);
        $chair = User::factory()->create([
            'role_id' => Role::where('name', 'ethics_committee_chair')->value('id'),
        ]);

        app(ClearanceService::class)->signEthicsTrack($research, $chair->id);

        $this->assertSame('monitoring', $research->remisApplication->fresh()->status);
    }
}
