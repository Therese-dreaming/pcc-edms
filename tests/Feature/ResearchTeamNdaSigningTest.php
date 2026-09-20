<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Dpreq\Jobs\GenerateResearchTeamNdaPdfJob;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Dpreq\Services\DpreqWorkflowService;
use App\Modules\Dpreq\Services\ResearchTeamNdaService;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// The public, token-gated co-researcher signing path (routes/dpreq.php). Regression cover for the
// 2026-09 bug where a token-only signer (user_id = null — they have no account) signing LAST
// crashed the request with "Server Error" *after* the signature was already recorded, because
// GenerateResearchTeamNdaPdfJob's constructor demanded a non-nullable int.
class ResearchTeamNdaSigningTest extends TestCase
{
    use RefreshDatabase;

    private User $researcher;

    private User $dpo;

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
        $this->dpo = User::factory()->create([
            'role_id' => Role::where('name', 'dpo_staff')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    /** An approved application whose NDA has a leader + one account-less co-researcher. */
    private function approvedApplicationWithCoResearcher(): DpreqApplication
    {
        $dpreq = app(ResearchApplicationService::class)->submitForm1([
            'research_title' => 'Team Study',
            'researcher_count' => 2,
            'co_researchers' => [
                ['full_name' => 'Maria Santos', 'email' => 'maria@example.com'],
            ],
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

        // Approving creates the NDA and materialises the co-researcher as a signatory with an
        // emailed signing link (and no user account, so user_id stays null).
        $workflow = app(DpreqWorkflowService::class);
        $workflow->startReview($dpreq->fresh());
        $workflow->approve($dpreq->fresh(), $this->dpo->id);

        return $dpreq->fresh();
    }

    /** @test */
    public function a_token_only_co_researcher_signing_last_completes_the_nda_without_a_server_error(): void
    {
        $dpreq = $this->approvedApplicationWithCoResearcher();
        $nda = $dpreq->researchApplication->researchTeamNda;

        $leader = $nda->signatories()->where('role', 'leader')->firstOrFail();
        $member = $nda->signatories()->where('role', 'member')->firstOrFail();

        // The co-researcher signs by emailed link and has no account — the exact trigger.
        $this->assertNull($member->user_id);

        // Leader signs first, so the NDA is not yet complete.
        app(ResearchTeamNdaService::class)->sign($leader, 'Lead Researcher');
        $this->assertSame('pending_signatures', $nda->fresh()->status);

        Bus::fake();

        // The co-researcher signs LAST through the public link, as a guest. This used to 500 on
        // GenerateResearchTeamNdaPdfJob's int-typed constructor after recording the signature.
        $this->post(route('nda.sign.submit', $member->fresh()->signing_token), [
            'typed_full_name' => 'Maria Santos',
            'obligations_accepted' => true,
        ])->assertRedirect();

        $this->assertSame('completed', $nda->fresh()->status);
        Bus::assertDispatched(GenerateResearchTeamNdaPdfJob::class);
    }

    /** @test */
    public function the_public_signing_page_renders_for_a_valid_token(): void
    {
        $dpreq = $this->approvedApplicationWithCoResearcher();
        $member = $dpreq->researchApplication->researchTeamNda->signatories()
            ->where('role', 'member')->firstOrFail();

        $this->get(route('nda.sign', $member->signing_token))->assertOk();
    }
}
