<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use App\Shared\Revisions\Models\RevisionRequest;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// FRS §IX Revision Management + the confirmed additive-amendment edit policy, exercised over the
// REMIS track (the shared mechanism is later reused by DPO).
class RevisionManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $applicant;
    private User $reviewer;
    private RemisApplication $application;

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
        $this->reviewer = User::factory()->create([
            'role_id' => Role::where('name', 'ethics_reviewer')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $ra = ResearchApplication::create([
            'applicant_id' => $this->applicant->id,
            'research_title' => 'A Study',
            'adviser_name' => 'Adam Adviser',
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
            'confidentiality_measures' => 'Anonymised.',
            'consent_process' => 'Consent.',
            'data_storage_plan' => 'Encrypted.',
            'status' => 'for_revision',
        ]);
    }

    /** @test */
    public function a_reviewer_raises_a_request_and_resubmission_is_blocked_until_it_is_resolved(): void
    {
        // Raise a mandatory document request.
        $this->actingAs($this->reviewer)
            ->post(route('revisions.raise', ['remis', $this->application->id]), [
                'item' => 'Please supply the updated consent form.',
                'kind' => 'document_required',
                'is_mandatory' => true,
            ])->assertRedirect();

        $req = RevisionRequest::first();
        $this->assertSame('open', $req->status);
        // The applicant is notified when a request is raised.
        $this->assertDatabaseHas('notifications', ['user_id' => $this->applicant->id]);

        // Resubmit refused while the mandatory request is open.
        $this->actingAs($this->applicant)
            ->post(route('remis.resubmit', $this->application->id))
            ->assertSessionHasErrors('resubmit');
        $this->assertSame('for_revision', $this->application->fresh()->status);

        // Applicant responds with a document -> request becomes 'responded'.
        $this->actingAs($this->applicant)
            ->post(route('revisions.respond', $req->id), [
                'response' => 'Updated consent attached.',
                'file' => UploadedFile::fake()->create('consent-v2.pdf', 80, 'application/pdf'),
            ])->assertRedirect();

        $req->refresh();
        $this->assertSame('responded', $req->status);
        $this->assertSame(1, $req->responses()->count());
        $this->assertNotNull($req->responses()->first()->document_id);

        // Still blocked (responded, not resolved).
        $this->actingAs($this->applicant)
            ->post(route('remis.resubmit', $this->application->id))
            ->assertSessionHasErrors('resubmit');

        // Reviewer resolves -> resubmission now succeeds.
        $this->actingAs($this->reviewer)->post(route('revisions.resolve', $req->id))->assertRedirect();
        $this->assertSame('resolved', $req->fresh()->status);

        $this->actingAs($this->applicant)
            ->post(route('remis.resubmit', $this->application->id))
            ->assertSessionHasNoErrors();
        $this->assertNotSame('for_revision', $this->application->fresh()->status);
    }

    /** @test */
    public function a_non_applicant_cannot_respond(): void
    {
        $req = $this->application->revisionRequests()->create([
            'raised_by' => $this->reviewer->id,
            'item' => 'Fix something',
            'kind' => 'comment',
            'is_mandatory' => true,
            'status' => 'open',
        ]);

        $this->actingAs($this->reviewer)
            ->post(route('revisions.respond', $req->id), ['response' => 'hi'])
            ->assertForbidden();
    }

    /** @test */
    public function amending_a_field_records_old_to_new_and_a_reason(): void
    {
        $this->actingAs($this->applicant)
            ->post(route('remis.amend', $this->application->id), [
                'changes' => ['risks_to_participants' => 'Revised: minimal, with a debrief.'],
                'reason' => 'Reviewer asked to expand the risk section.',
            ])->assertRedirect();

        $this->assertSame('Revised: minimal, with a debrief.', $this->application->fresh()->risks_to_participants);
        $this->assertDatabaseHas('application_amendments', [
            'field' => 'risks_to_participants',
            'old_value' => 'Minimal.',
            'new_value' => 'Revised: minimal, with a debrief.',
            'reason' => 'Reviewer asked to expand the risk section.',
        ]);
    }

    /** @test */
    public function a_non_amendable_field_is_ignored(): void
    {
        $this->actingAs($this->applicant)
            ->post(route('remis.amend', $this->application->id), [
                'changes' => ['status' => 'approved'], // not in AMENDABLE_FIELDS
                'reason' => 'Trying to sneak a status change.',
            ])->assertSessionHasErrors('changes');

        $this->assertSame('for_revision', $this->application->fresh()->status);
    }

    /** @test */
    public function fields_cannot_be_amended_once_out_of_revision(): void
    {
        $this->application->update(['status' => 'for_review']);

        $this->actingAs($this->applicant)
            ->post(route('remis.amend', $this->application->id), [
                'changes' => ['benefits' => 'Changed after the fact.'],
                'reason' => 'Too late.',
            ])->assertSessionHasErrors('changes');

        $this->assertSame('Research.', $this->application->fresh()->benefits);
    }
}
