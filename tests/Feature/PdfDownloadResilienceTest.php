<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Dpreq\Jobs\GenerateDpreqFormPdfJob;
use App\Shared\Auth\Models\Role;
use App\Shared\Clearance\Services\ClearanceService;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// Live-test report 2026-09-21: the DPO clearance download crashed with
// "Attempt to read property file_path on null" whenever the queued certificate-PDF job never ran
// (stalled/absent worker) — the same unguarded read existed on the REMIS side. A Form 1 edited
// after submission must also never download as the stale pre-edit PDF. All three downloads now
// generate on demand; these tests cover the regeneration paths end-to-end (real Browsershot,
// sync queue — same as the rest of the suite) plus the template half of "the form changed when I
// edited it": Parts II–V intake answers must actually print on Form 1.
class PdfDownloadResilienceTest extends TestCase
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

    private function submittedApplication()
    {
        Auth::onceUsingId($this->researcher->id);

        return app(ResearchApplicationService::class)->submitForm1([
            'research_title' => 'Stale PDF Study',
            'researcher_count' => 1,
            'adviser_name' => 'Adam Adviser',
            'applicant_category' => 'student',
            'department' => 'CCS',
            'respondents' => 'Students',
            'target_respondent_count' => 50,
            'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form',
            'funding_source_type' => 'self_funded',
            'recruitment_method' => 'Class announcements',
            'target_participants' => ['students', 'vulnerable_groups'],
            'risk_band' => 'moderate',
            'risk_band_explanation' => 'Minimal discomfort, questions screened.',
            'data_classification' => 'sensitive_personal_information',
            'data_storage_method' => 'Encrypted external drive',
            'data_access_persons' => 'Researcher and adviser only',
            'data_retention_period' => 'Two years after publication',
            'data_disposal_method' => 'Secure deletion',
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
    }

    /** @test */
    public function dpo_clearance_download_regenerates_when_the_queued_pdf_never_ran(): void
    {
        $dpreq = $this->submittedApplication();

        $certificate = app(ClearanceService::class)->signDpoTrack($dpreq->fresh()->researchApplication, $this->dpo->id);
        $this->assertNotNull($certificate->dpreq_issued_at);

        // Simulate the stalled worker: issuance succeeded but its certificate PDF does not exist.
        Document::where('id', $certificate->dpreq_pdf_document_id)->first()?->delete();
        $certificate->update(['dpreq_pdf_document_id' => null]);

        $this->actingAs($this->researcher)
            ->get(route('dpreq.clearance-pdf', $dpreq))
            ->assertOk();

        $this->assertNotNull($certificate->refresh()->dpreq_pdf_document_id, 'download regenerated the PDF');
    }

    /** @test */
    public function ethics_clearance_download_regenerates_when_the_queued_pdf_never_ran(): void
    {
        $dpreq = $this->submittedApplication();
        $remis = $dpreq->researchApplication->remisApplication;

        $certificate = app(ClearanceService::class)->signEthicsTrack($dpreq->fresh()->researchApplication, $this->dpo->id);
        $this->assertNotNull($certificate->remis_issued_at);

        $certificate->update(['remis_pdf_document_id' => null]);

        $this->actingAs($this->researcher)
            ->get(route('remis.clearance-pdf', $remis))
            ->assertOk();

        $this->assertNotNull($certificate->refresh()->remis_pdf_document_id, 'download regenerated the PDF');
    }

    /** @test */
    public function form1_download_regenerates_when_the_stored_pdf_predates_the_last_edit(): void
    {
        $dpreq = $this->submittedApplication();

        // v1 rendered at submission time (dispatch runs inline on the sync test queue).
        GenerateDpreqFormPdfJob::dispatchSync($dpreq->id, $this->researcher->id);
        $v1 = $dpreq->documents()->where('document_type', 'Form1Application')->where('is_current_version', true)->firstOrFail();

        // An edit lands after the PDF's timestamp, and the queued regeneration never runs…
        $this->travel(5)->seconds();
        $dpreq->researchApplication->update(['research_title' => 'Edited Title']);

        // …so the download must notice the stale PDF and rebuild it rather than streaming v1.
        $this->actingAs($this->researcher)
            ->get(route('dpreq.form-pdf', $dpreq))
            ->assertOk();

        $current = $dpreq->documents()->where('document_type', 'Form1Application')->where('is_current_version', true)->latest()->first();
        $this->assertNotSame($v1->id, $current->id, 'a fresher version was generated on download');
    }

    /** @test */
    public function form1_prints_the_intake_answers_so_a_regenerated_pdf_differs_on_paper(): void
    {
        // Regenerating on download is pointless if the template never prints the fields the intake
        // collects — Parts II–V must appear in the rendered Form 1.
        $dpreq = $this->submittedApplication();

        $html = view('pdf.dpreq-form1', [
            'researchApplication' => $dpreq->researchApplication,
            'application' => $dpreq,
        ])->render();

        foreach ([
            'Self-funded',
            'Class announcements',
            'Students, Vulnerable Groups',
            'Moderate',
            'Minimal discomfort, questions screened.',
            'Sensitive Personal Information',
            'Encrypted external drive',
            'Researcher and adviser only',
            'Two years after publication',
            'Secure deletion',
        ] as $needle) {
            $this->assertStringContainsString($needle, $html, "Form 1 PDF is missing: {$needle}");
        }
    }
}
