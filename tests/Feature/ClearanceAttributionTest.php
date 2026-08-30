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
use Tests\TestCase;

// 2026-08-31 audit — issuance can be triggered with NO authenticated session: the last Research
// Team NDA signer may use their emailed token link, and completion then issues the DPO clearance.
// status_history.changed_by was NOT NULL with no fallback, so that path 500'd at the exact moment
// the clearance should have issued. The column is now nullable and issuance passes an explicit
// actor, which these tests pin down.
class ClearanceAttributionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Bus::fake();
        $this->seed(RoleSeeder::class);
    }

    private function makeApprovedRemis(): ResearchApplication
    {
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

        return $ra;
    }

    /** @test */
    public function issuance_works_unauthenticated_and_attributes_the_signer(): void
    {
        $ra = $this->makeApprovedRemis();
        $chair = User::factory()->create([
            'role_id' => Role::where('name', 'ethics_committee_chair')->value('id'),
        ]);

        // Deliberately no actingAs() — this simulates the token-signing completion flow.
        $certificate = app(ClearanceService::class)->signEthicsTrack($ra, $chair->id);

        $this->assertNotNull($certificate->remis_certificate_number);

        $remis = $ra->remisApplication->fresh();
        $this->assertSame('monitoring', $remis->status);

        $history = $remis->statusHistory()->get();
        $this->assertSame($chair->id, $history->firstWhere('to_status', 'clearance_issued')->changed_by);
        $this->assertSame($chair->id, $history->firstWhere('to_status', 'monitoring')->changed_by);
    }
}
