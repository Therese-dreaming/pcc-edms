<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Auth\Models\Role;
use App\Shared\Clearance\Services\ClearanceService;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

// 2026-08-31 audit — the public verification portal must name the instrument correctly:
// an exemption certificate is not a "Research Ethics Clearance".
class VerificationPortalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->seed(RoleSeeder::class);
    }

    private function issueEthicsCertificate(bool $exempted): string
    {
        Bus::fake();

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

        RemisApplication::create([
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
            'status' => 'approved',
        ]);

        $chair = User::factory()->create([
            'role_id' => Role::where('name', 'ethics_committee_chair')->value('id'),
        ]);

        $this->actingAs($chair);

        $certificate = app(ClearanceService::class)->signEthicsTrack($ra, $chair->id, exempted: $exempted);

        return $certificate->remis_certificate_number;
    }

    /** @test */
    public function an_exemption_certificate_is_labeled_as_such(): void
    {
        $controlNumber = $this->issueEthicsCertificate(exempted: true);

        $this->get('/verify?q=' . urlencode($controlNumber))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('result.track', 'ETHICS')
                ->where('result.track_label', 'Certificate of Exemption from Research Ethics Clearance')
                ->where('result.control_number', $controlNumber));
    }

    /** @test */
    public function a_clearance_certificate_keeps_its_label(): void
    {
        $controlNumber = $this->issueEthicsCertificate(exempted: false);

        $this->get('/verify?q=' . urlencode($controlNumber))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('result.track', 'ETHICS')
                ->where('result.track_label', 'Research Ethics Clearance'));
    }

    /** @test */
    public function an_unknown_lookup_fails_closed_with_no_result(): void
    {
        $this->get('/verify?q=REMIS-2026-999999')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('result', null)
                ->where('searched', true));
    }
}
