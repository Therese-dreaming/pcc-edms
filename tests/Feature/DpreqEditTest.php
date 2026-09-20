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

    // 2026-09 revision→edit fix — the plot hole this closes: DPO staff raises a MANDATORY revision
    // (e.g. "fix the data risks") on an under-review application; the application must return to the
    // applicant so they can edit the Form-1 inputs, which regenerates the Form 1 PDF as a new version.
    private function dpoStaff(): User
    {
        return User::factory()->create([
            'role_id' => Role::where('name', 'dpo_staff')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    /** @test */
    public function a_mandatory_dpreq_revision_returns_the_application_so_the_owner_can_edit_and_reversion_form1(): void
    {
        $staff = $this->dpoStaff();

        // Build an application and move it to under_review (the state DPO staff review from).
        $dpreq = $this->returnedApplication();
        $dpreq->update(['status' => 'under_review']);

        // Staff raises a mandatory revision request ("change the data risks").
        $this->actingAs($staff)
            ->post(route('revisions.raise', ['dpreq', $dpreq->id]), [
                'item' => 'Please expand the data-risk section.',
                'kind' => 'comment',
                'is_mandatory' => true,
            ])->assertRedirect();

        // The application is returned to the applicant and the request is open.
        $this->assertSame('returned', $dpreq->fresh()->status);
        $this->assertDatabaseHas('revision_requests', [
            'requestable_id' => $dpreq->id,
            'is_mandatory' => true,
            'status' => 'open',
        ]);

        // The owner can now edit the Form-1 inputs → Form 1 PDF regenerates as a new version.
        Bus::fake();
        $this->actingAs($this->researcher)
            ->put(route('dpreq.update', $dpreq->id), $this->editPayload(['risk_band' => 'high', 'research_title' => 'Revised Title']))
            ->assertRedirect(route('dpreq.show', $dpreq->id));
        $this->assertSame('Revised Title', $dpreq->researchApplication->fresh()->research_title);
        Bus::assertDispatched(GenerateDpreqFormPdfJob::class);
    }

    /** @test */
    public function an_optional_dpreq_revision_does_not_change_status(): void
    {
        $staff = $this->dpoStaff();
        $dpreq = $this->returnedApplication();
        $dpreq->update(['status' => 'under_review']);

        $this->actingAs($staff)
            ->post(route('revisions.raise', ['dpreq', $dpreq->id]), [
                'item' => 'Optional: consider citing a source.',
                'kind' => 'comment',
                'is_mandatory' => false,
            ])->assertRedirect();

        // Optional / non-mandatory requests must NOT bounce the application out of review.
        $this->assertSame('under_review', $dpreq->fresh()->status);
    }

    /** @test */
    public function a_revision_cannot_be_raised_before_the_review_has_started(): void
    {
        $staff = $this->dpoStaff();
        $dpreq = $this->returnedApplication();
        $dpreq->update(['status' => 'submitted']); // not yet under review

        $this->actingAs($staff)
            ->post(route('revisions.raise', ['dpreq', $dpreq->id]), [
                'item' => 'Please expand the data-risk section.',
                'kind' => 'comment',
                'is_mandatory' => true,
            ])->assertSessionHasErrors('item');

        // No request created, status untouched.
        $this->assertSame(0, $dpreq->revisionRequests()->count());
        $this->assertSame('submitted', $dpreq->fresh()->status);
    }

    /** @test */
    public function resubmitting_a_returned_application_auto_resolves_the_mandatory_revision(): void
    {
        $staff = $this->dpoStaff();
        $dpreq = $this->returnedApplication();
        $dpreq->update(['status' => 'under_review']);

        // DPO raises a mandatory comment revision → returns the app for editing.
        $this->actingAs($staff)
            ->post(route('revisions.raise', ['dpreq', $dpreq->id]), [
                'item' => 'Please expand the data-risk section.',
                'kind' => 'comment',
                'is_mandatory' => true,
            ])->assertRedirect();
        $this->assertSame('returned', $dpreq->fresh()->status);

        // The researcher edits the data-risk inputs and resubmits — no manual "resolve" needed.
        $this->actingAs($this->researcher)
            ->put(route('dpreq.update', $dpreq->id), $this->editPayload(['risk_band' => 'high', 'risk_band_explanation' => 'Expanded.']))
            ->assertRedirect(route('dpreq.show', $dpreq->id));

        $this->actingAs($this->researcher)
            ->post(route('dpreq.resubmit', $dpreq->id))
            ->assertSessionHasNoErrors();

        // Back in the queue and the revision is auto-resolved (annotated via resubmission).
        $this->assertSame('submitted', $dpreq->fresh()->status);
        $this->assertDatabaseHas('revision_requests', [
            'requestable_id' => $dpreq->id,
            'status' => 'resolved',
        ]);
    }

    /** @test */
    public function a_mandatory_document_request_does_not_return_the_application_but_blocks_approval(): void
    {
        $staff = $this->dpoStaff();
        $dpreq = $this->returnedApplication();
        $dpreq->update(['status' => 'under_review']);

        // A mandatory DOCUMENT request needs no input edits — the app must stay under_review and
        // only approval is held (the applicant uploads the file from the revision panel).
        $this->actingAs($staff)
            ->post(route('revisions.raise', ['dpreq', $dpreq->id]), [
                'item' => 'Please attach the signed parental-consent letter.',
                'kind' => 'document_required',
                'is_mandatory' => true,
            ])->assertRedirect();

        $this->assertSame('under_review', $dpreq->fresh()->status);

        // Approval is blocked while the mandatory document request is outstanding.
        $this->actingAs($staff)
            ->post(route('dpreq.approve', $dpreq->id))
            ->assertSessionHasErrors('nda');
    }
}
