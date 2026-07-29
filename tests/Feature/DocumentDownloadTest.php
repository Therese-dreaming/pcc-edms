<?php

namespace Tests\Feature;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// Concern 7 (2026-07-28) — downloading a submitted document 403'd because the policies had no
// `download` method. The intake uploads are shared research artifacts downloadable from both tracks.
class DocumentDownloadTest extends TestCase
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

    private function submittedDocument(): Document
    {
        Auth::onceUsingId($this->researcher->id);
        app(ResearchApplicationService::class)->submitForm1([
            'research_title' => 'A Study',
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
            'documents' => [
                'research_proposal' => [UploadedFile::fake()->create('proposal.pdf', 100, 'application/pdf')],
            ],
        ], $this->researcher);

        return Document::where('document_type', 'RESEARCHPROPOSAL')->firstOrFail();
    }

    /** @test */
    public function the_owner_can_download_a_submitted_document(): void
    {
        $doc = $this->submittedDocument();

        $this->actingAs($this->researcher)
            ->get(route('documents.download', $doc->id))
            ->assertOk();
    }

    /** @test */
    public function dpo_staff_can_download_a_submitted_document(): void
    {
        $doc = $this->submittedDocument();
        $dpo = User::factory()->create([
            'role_id' => Role::where('name', 'dpo_staff')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($dpo)
            ->get(route('documents.download', $doc->id))
            ->assertOk();
    }

    /** @test */
    public function an_unrelated_researcher_cannot_download(): void
    {
        $doc = $this->submittedDocument();
        $other = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($other)
            ->get(route('documents.download', $doc->id))
            ->assertForbidden();
    }
}
