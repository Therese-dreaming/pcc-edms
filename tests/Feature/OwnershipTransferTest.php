<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Dpreq\Models\ResearchTeamNda;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Auth\Models\Role;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// B3 (concern 3.4) — a System Administrator reassigns a group's lead when the original leader
// leaves, without touching already-submitted documents or signatures.
class OwnershipTransferTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function researcher(string $email): User
    {
        return User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'email' => $email,
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    /** @test */
    public function admin_reassigns_the_lead_and_preserves_documents_and_signatures(): void
    {
        $oldLeader = $this->researcher('old-leader@example.com');
        $newLeader = $this->researcher('new-leader@example.com');
        $admin = User::factory()->create(['role_id' => Role::where('name', 'system_administrator')->value('id'), 'account_status' => 'active', 'email_verified_at' => now()]);

        $ra = ResearchApplication::create([
            'applicant_id' => $oldLeader->id, 'research_title' => 'S', 'adviser_name' => 'A', 'department' => 'CCS',
            'respondents' => 'x', 'target_respondent_count' => 10, 'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form', 'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonth()->toDateString(),
        ]);
        $dpreq = DpreqApplication::create([
            'research_application_id' => $ra->id, 'tracking_number' => 'DPREQ-2026-9001', 'applicant_id' => $oldLeader->id,
            'applicant_type' => 'internal_researcher', 'department' => 'CCS', 'purpose' => 'R', 'data_types' => ['x'],
            'data_subjects' => ['s'], 'retention_plan' => 'x', 'status' => 'approved',
        ]);
        $remis = RemisApplication::create([
            'research_application_id' => $ra->id, 'tracking_number' => 'REC-9001', 'applicant_id' => $oldLeader->id,
            'study_type' => 'thesis_dissertation', 'study_design' => 'quantitative', 'target_population' => 'x',
            'participant_count' => 10, 'inclusion_criteria' => 'x', 'exclusion_criteria' => 'x', 'study_sites' => 'x',
            'risks_to_participants' => 'x', 'benefits' => 'x', 'confidentiality_measures' => 'x',
            'consent_process' => 'x', 'data_storage_plan' => 'x', 'status' => 'for_review',
        ]);

        // A submitted document and a signed NDA row belonging to the old leader.
        $doc = Document::create([
            'documentable_type' => $dpreq->getMorphClass(), 'documentable_id' => $dpreq->id, 'document_type' => 'Form1Application',
            'file_path' => 'p', 'original_filename' => 'o.pdf', 'mime_type' => 'application/pdf', 'size_bytes' => 1,
            'version' => 1, 'is_current_version' => true, 'uploaded_by' => $oldLeader->id,
        ]);
        $nda = ResearchTeamNda::create(['research_application_id' => $ra->id, 'tracking_number' => 'RTNDA-2026-9001', 'status' => 'completed']);
        $signatory = $nda->signatories()->create(['user_id' => $oldLeader->id, 'full_name' => 'Old Leader', 'role' => 'leader', 'signature_id' => 'Old Leader', 'signed_at' => now()]);

        $this->actingAs($admin);
        app(ResearchApplicationService::class)->transferOwnership($ra->fresh(), $newLeader, $admin);

        // Ownership moved on all three records.
        $this->assertSame($newLeader->id, $ra->fresh()->applicant_id);
        $this->assertSame($newLeader->id, $dpreq->fresh()->applicant_id);
        $this->assertSame($newLeader->id, $remis->fresh()->applicant_id);

        // Documents and the historical signature are untouched.
        $this->assertSame($oldLeader->id, $doc->fresh()->uploaded_by);
        $this->assertSame($oldLeader->id, $signatory->fresh()->user_id);
        $this->assertNotNull($signatory->fresh()->signed_at);

        // Old account deactivated; the transfer is on the audit trail + both timelines.
        $this->assertSame('deactivated', $oldLeader->fresh()->account_status);
        $this->assertDatabaseHas('audit_log', ['event_type' => 'research_application.ownership_transferred']);
        $this->assertDatabaseHas('status_history', ['statusable_id' => $dpreq->id, 'comments' => "Ownership transferred from {$oldLeader->name} to {$newLeader->name} by {$admin->name}."]);
    }

    /** @test */
    public function only_a_system_administrator_can_transfer(): void
    {
        $oldLeader = $this->researcher('lead@example.com');
        $ra = ResearchApplication::create([
            'applicant_id' => $oldLeader->id, 'research_title' => 'S', 'adviser_name' => 'A',
            'respondents' => 'x', 'target_respondent_count' => 10, 'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form', 'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonth()->toDateString(),
        ]);
        $dpreq = DpreqApplication::create([
            'research_application_id' => $ra->id, 'tracking_number' => 'DPREQ-2026-9002', 'applicant_id' => $oldLeader->id,
            'applicant_type' => 'internal_researcher', 'purpose' => 'R', 'data_types' => ['x'], 'data_subjects' => ['s'],
            'retention_plan' => 'x', 'status' => 'approved',
        ]);

        // A non-admin (the DPO staff) is forbidden.
        $dpo = User::factory()->create(['role_id' => Role::where('name', 'dpo_staff')->value('id'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->actingAs($dpo)
            ->post(route('dpreq.transfer-ownership', $dpreq), ['new_leader_email' => 'lead@example.com'])
            ->assertForbidden();
    }
}
