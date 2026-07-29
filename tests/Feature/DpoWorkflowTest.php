<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Dpreq\Services\DpreqWorkflowService;
use App\Modules\Dpreq\Services\ResearchTeamNdaService;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use App\Shared\Revisions\Services\RevisionService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

// The collapsed DPO workflow (Review -> Approve) and the item-7 gate: DPO can't approve while a
// required document it requested is still outstanding.
class DpoWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $dpo;
    private User $applicant;
    private DpreqApplication $application;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->seed(RoleSeeder::class);

        $this->dpo = User::factory()->create(['role_id' => Role::where('name', 'dpo_staff')->value('id'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->applicant = User::factory()->create(['role_id' => Role::where('name', 'researcher_internal')->value('id'), 'account_status' => 'active', 'email_verified_at' => now()]);

        $ra = ResearchApplication::create([
            'applicant_id' => $this->applicant->id, 'research_title' => 'A Study', 'adviser_name' => 'Adam',
            'department' => 'CCS', 'respondents' => 'Students', 'target_respondent_count' => 50,
            'data_collection_method' => 'survey_form', 'data_capturing_tool' => 'electronic_form',
            'target_start_date' => now()->toDateString(), 'target_end_date' => now()->addMonths(3)->toDateString(),
            'target_end_date' => now()->addMonths(3)->toDateString(),
        ]);

        $this->application = DpreqApplication::create([
            'research_application_id' => $ra->id, 'tracking_number' => 'DPREQ-2026-0001',
            'applicant_id' => $this->applicant->id, 'applicant_type' => 'internal_researcher',
            'department' => 'CCS', 'purpose' => 'Research', 'data_types' => ['x'], 'data_subjects' => ['students'],
            'retention_plan' => 'Two years.', 'status' => 'submitted',
        ]);

        // No NDA at submission (concern 7, 2026-07-26): it is created on approval and signing opens
        // only then. The clearance is gated on the team finishing signing, not on approval.
    }

    /** Sign the freshly-created team NDA as its leader (the lone signatory when there are no
     *  co-researchers), which drives the NDA to `completed` and issues the DPO clearance. */
    private function leaderSignsNda(): void
    {
        $leader = $this->application->fresh()->researchApplication->researchTeamNda
            ->signatories()->where('role', 'leader')->firstOrFail();
        app(ResearchTeamNdaService::class)->sign($leader, 'Rosa');
    }

    /** @test */
    public function the_collapsed_flow_runs_submitted_to_under_review_to_approved(): void
    {
        $this->actingAs($this->dpo);
        $workflow = app(DpreqWorkflowService::class);

        // No 'screening' / 'endorsed' hops any more.
        $this->assertSame(['under_review'], DpreqApplication::LEGAL_TRANSITIONS['submitted']);

        $workflow->startReview($this->application);
        $this->assertSame('under_review', $this->application->fresh()->status);

        // Approval no longer issues the clearance — it moves to `approved` and opens NDA signing.
        $workflow->approve($this->application->fresh(), $this->dpo->id);
        $this->assertSame('approved', $this->application->fresh()->status);
        $this->assertNotNull($this->application->fresh()->researchApplication->researchTeamNda);

        // The clearance issues only once the team finishes signing the NDA.
        $this->leaderSignsNda();
        $this->assertSame('clearance_issued', $this->application->fresh()->status);
    }

    /** @test */
    public function approval_is_blocked_while_a_required_document_request_is_outstanding(): void
    {
        $this->actingAs($this->dpo);
        $workflow = app(DpreqWorkflowService::class);
        $workflow->startReview($this->application);

        // DPO requests an additional required document (item 7).
        $request = app(RevisionService::class)->raise(
            $this->application, $this->dpo, 'Please supply the signed data-sharing agreement.',
            $this->applicant, 'document_required', true,
        );

        // Approval is refused.
        try {
            $workflow->approve($this->application->fresh(), $this->dpo->id);
            $this->fail('Approval should have been blocked.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('outstanding required items', $e->getMessage());
        }
        $this->assertSame('under_review', $this->application->fresh()->status);

        // Applicant responds, DPO resolves, approval now goes through.
        app(RevisionService::class)->respond($request, $this->applicant, 'Attached.', null);
        app(RevisionService::class)->resolve($request->fresh(), $this->dpo);

        $workflow->approve($this->application->fresh(), $this->dpo->id);
        $this->assertSame('approved', $this->application->fresh()->status);

        // ...and the clearance follows once the NDA is signed.
        $this->leaderSignsNda();
        $this->assertSame('clearance_issued', $this->application->fresh()->status);
    }

    /** @test */
    public function rejection_requires_the_staff_members_own_password(): void
    {
        $this->actingAs($this->dpo);
        app(DpreqWorkflowService::class)->startReview($this->application);

        // C2 — a wrong/missing password is a 422 on `password` and changes nothing.
        $this->post(route('dpreq.reject', $this->application), ['reason' => 'Insufficient basis.', 'password' => 'not-my-password'])
            ->assertSessionHasErrors('password');
        $this->assertSame('under_review', $this->application->fresh()->status);

        // The correct password (factory default) lets the rejection through.
        $this->post(route('dpreq.reject', $this->application), ['reason' => 'Insufficient basis.', 'password' => 'password'])
            ->assertSessionHasNoErrors();
        $this->assertSame('rejected', $this->application->fresh()->status);
    }

    /** @test */
    public function the_retired_screening_routes_are_gone(): void
    {
        $this->actingAs($this->dpo)->post("/dpreq/{$this->application->id}/start-screening")->assertNotFound();
        $this->actingAs($this->dpo)->post("/dpreq/{$this->application->id}/endorse")->assertNotFound();
    }
}
