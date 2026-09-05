<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Dpreq\Mail\CoResearcherInvitationMail;
use App\Modules\Dpreq\Mail\ResearchTeamNdaInvitationMail;
use App\Shared\Auth\Models\Role;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// FRS §III.E — Form 1 mandatory/conditional document uploads and §III.B co-researcher identities.
class Form1DocumentsTest extends TestCase
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

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'research_title' => 'A Study',
            'research_category' => 'academic',
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
            'researcher_signature' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'applicant_category' => 'student',
            'review_checklist' => [
                'voluntary_participation' => 'yes',
                'confidentiality' => 'yes',
                'free_withdrawal' => 'yes',
                'avoid_harm' => 'yes',
                'academic_use_only' => 'yes',
            ],
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
        ], $overrides);
    }

    private function mandatoryDocs(): array
    {
        // Each slot accepts one OR MORE files (stakeholder 2026-07-28), so each is posted as an array.
        return [
            'documents' => [
                'research_proposal' => [UploadedFile::fake()->create('proposal.pdf', 100, 'application/pdf')],
                'consent_form' => [UploadedFile::fake()->create('consent.pdf', 100, 'application/pdf')],
                'research_instrument' => [UploadedFile::fake()->create('instrument.pdf', 100, 'application/pdf')],
                'approved_request_letter' => [UploadedFile::fake()->create('approval.pdf', 100, 'application/pdf')],
                'adviser_endorsement_letter' => [UploadedFile::fake()->create('endorsement.pdf', 100, 'application/pdf')],
            ],
        ];
    }

    /** @test */
    public function submission_is_rejected_when_a_mandatory_document_is_missing(): void
    {
        $docs = $this->mandatoryDocs();
        unset($docs['documents']['consent_form']); // drop one mandatory doc

        $this->actingAs($this->researcher)
            ->post(route('dpreq.store'), $this->payload($docs))
            ->assertSessionHasErrors('documents.consent_form');

        $this->assertDatabaseCount('research_applications', 0);
    }

    /** @test */
    public function submission_succeeds_with_all_mandatory_documents_and_stores_them_named(): void
    {
        $this->actingAs($this->researcher)
            ->post(route('dpreq.store'), $this->payload($this->mandatoryDocs()))
            ->assertRedirect();

        $this->assertDatabaseCount('research_applications', 1);

        // The three uploaded ethics documents attach to the REMIS application, named by convention.
        // (A separate auto-generated Form 1 PDF also exists on the DPREQ side — not counted here.)
        $ethicsDocs = Document::whereIn('document_type', ['RESEARCHPROPOSAL', 'INFORMEDCONSENT', 'QUESTIONNAIRE'])->get();
        $this->assertSame(3, $ethicsDocs->count());
        foreach ($ethicsDocs as $doc) {
            $this->assertStringStartsWith('REC-REMIS-', basename($doc->file_path));
            $this->assertStringEndsWith('_V1.pdf', basename($doc->file_path));
        }
    }

    /** @test */
    public function a_blank_co_researcher_row_is_dropped_rather_than_erroring(): void
    {
        // The applicant added a co-researcher row (so researcher_count = 2) but left it empty. The
        // empty row is treated as an accident: dropped, count reset to solo, submission succeeds.
        $payload = $this->payload([
            ...$this->mandatoryDocs(),
            'researcher_count' => 2,
            'co_researchers' => [
                ['full_name' => '   ', 'email' => ''],
            ],
        ]);

        $this->actingAs($this->researcher)
            ->post(route('dpreq.store'), $payload)
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $research = ResearchApplication::first();
        $this->assertNotNull($research);
        $this->assertSame([], $research->co_researchers);
        $this->assertSame(1, $research->researcher_count);
    }

    /** @test */
    public function parent_consent_and_assent_are_required_when_minors_are_involved(): void
    {
        $this->actingAs($this->researcher)
            ->post(route('dpreq.store'), $this->payload([...$this->mandatoryDocs(), 'minors_involved' => true]))
            ->assertSessionHasErrors(['documents.parent_consent', 'documents.assent_form']);

        $this->assertDatabaseCount('research_applications', 0);
    }

    /** @test */
    public function co_researchers_are_captured_at_submission_and_become_nda_signatories_after_approval(): void
    {
        // B1 (concern 7) — the NDA is created AFTER DPO approval, not at submission. Co-researcher
        // identities are captured on research_applications.co_researchers up front, then
        // materialised into signatories (with emailed signing links) when the DPO approves.
        $payload = $this->payload([
            ...$this->mandatoryDocs(),
            'researcher_count' => 2,
            'co_researchers' => [
                ['full_name' => 'Maria Santos', 'email' => 'maria@example.com'],
            ],
        ]);

        $this->actingAs($this->researcher)->post(route('dpreq.store'), $payload)->assertRedirect();

        $research = ResearchApplication::first();
        // No NDA yet — only the captured identities.
        $this->assertNull($research->researchTeamNda);
        $this->assertSame('maria@example.com', $research->co_researchers[0]['email']);

        // ...but the co-researcher IS emailed a heads-up at submission (no signing link — that
        // follows at approval). This is the "invite" that reaches them right away.
        Mail::assertSent(CoResearcherInvitationMail::class, fn ($mail) => $mail->hasTo('maria@example.com'));

        // DPO takes it under review and approves — that's what creates the NDA + issues links.
        $dpo = User::factory()->create([
            'role_id' => Role::where('name', 'dpo_staff')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);
        $dpreq = $research->dpreqApplication;
        $this->actingAs($dpo)->post(route('dpreq.start-review', $dpreq));
        $this->actingAs($dpo)->post(route('dpreq.approve', $dpreq), ['expected_version' => $dpreq->fresh()->version]);

        $nda = $research->fresh()->researchTeamNda;
        $this->assertNotNull($nda);
        // Leader + one invited co-researcher.
        $this->assertSame(2, $nda->signatories()->count());
        $this->assertDatabaseHas('research_team_nda_signatories', [
            'email' => 'maria@example.com',
            'role' => 'member',
        ]);
        // A2 — invitation mail is sent synchronously (not queued).
        Mail::assertSent(ResearchTeamNdaInvitationMail::class);
    }

    /** @test */
    public function a_slot_accepts_multiple_files(): void
    {
        // The applicant attaches two research instruments to the one slot (stakeholder 2026-07-28).
        $docs = $this->mandatoryDocs();
        $docs['documents']['research_instrument'] = [
            UploadedFile::fake()->create('instrument-a.pdf', 100, 'application/pdf'),
            UploadedFile::fake()->create('instrument-b.pdf', 100, 'application/pdf'),
        ];

        $this->actingAs($this->researcher)
            ->post(route('dpreq.store'), $this->payload($docs))
            ->assertRedirect();

        // Both files stored as versioned QUESTIONNAIRE documents.
        $this->assertSame(2, Document::where('document_type', 'QUESTIONNAIRE')->count());
    }

    /** @test */
    public function an_other_dropdown_value_is_stored_as_the_specified_free_text(): void
    {
        $this->actingAs($this->researcher)
            ->post(route('dpreq.store'), $this->payload([
                ...$this->mandatoryDocs(),
                'data_collection_method' => 'other',
                'data_collection_method_other' => 'Focus group discussion',
            ]))
            ->assertRedirect();

        $this->assertSame('Focus group discussion', ResearchApplication::first()->data_collection_method);
    }

    /** @test */
    public function specifying_other_without_the_free_text_is_rejected(): void
    {
        $this->actingAs($this->researcher)
            ->post(route('dpreq.store'), $this->payload([
                ...$this->mandatoryDocs(),
                'data_collection_method' => 'other',
                'data_collection_method_other' => '',
            ]))
            ->assertSessionHasErrors('data_collection_method_other');
    }

    /** @test */
    public function an_additional_document_is_stored_against_the_dpreq_track(): void
    {
        $payload = $this->payload([
            ...$this->mandatoryDocs(),
            'additional_documents' => [
                ['label' => 'DATASET', 'file' => UploadedFile::fake()->create('data.xlsx', 50)],
            ],
        ]);

        $this->actingAs($this->researcher)->post(route('dpreq.store'), $payload)->assertRedirect();

        $additional = Document::where('document_type', 'DATASET')->first();
        $this->assertNotNull($additional);
        $this->assertStringStartsWith('REC-REQ-', basename($additional->file_path));
    }

    /** @test */
    public function the_applicant_category_is_derived_from_the_account_not_the_form(): void
    {
        // 2026-09-05 — the "Are you filing as…?" selector was removed; the category is fixed on the
        // account. An employee's submission is filed as 'employee' even if the payload says otherwise.
        $employee = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'applicant_category' => 'employee',
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($employee)
            ->post(route('dpreq.store'), $this->payload([
                ...$this->mandatoryDocs(),
                'applicant_category' => 'student', // ignored — derived from the account
                'position' => 'Faculty, College of Education',
            ]))
            ->assertRedirect();

        $this->assertSame('employee', ResearchApplication::first()->applicant_category);
    }
}
