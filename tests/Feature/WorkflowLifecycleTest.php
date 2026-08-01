<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Dpnda\Models\DpndaRecord;
use App\Modules\Dpnda\Models\Placement;
use App\Modules\Dpnda\Services\DpndaWorkflowService;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Dpreq\Services\DpreqWorkflowService;
use App\Modules\Dpreq\Services\ResearchTeamNdaService;
use App\Modules\Remis\Incident\Services\IncidentService;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Models\ReviewAssignment;
use App\Modules\Remis\Monitoring\Services\RemisMonitoringService;
use App\Modules\Remis\Services\RemisWorkflowService;
use App\Shared\Auth\Models\Role;
use App\Shared\Clearance\Services\ClearanceService;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use App\Shared\Revisions\Services\RevisionService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

/**
 * Full-lifecycle workflow tests for all three tracks (DPREQ, DPNDA, REMIS), covering:
 * - Happy paths end-to-end
 * - Illegal transition rejection
 * - The new resubmit gate (mandatory revisions)
 * - Screening status validation (no orphaned checklists)
 * - Incident → auto-pause → resume
 * - Monitoring → completion → archive
 * - Tracking number uniqueness after soft-delete
 */
class WorkflowLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private User $dpo;
    private User $applicant;
    private User $coordinator;
    private User $trainee;
    private User $adviser;
    private User $programHead;
    private User $dean;
    private User $secretariat;
    private User $reviewer;
    private User $chair;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Queue::fake();
        $this->seed(RoleSeeder::class);

        $role = fn (string $name) => Role::where('name', $name)->value('id');

        $this->dpo = User::factory()->create(['role_id' => $role('dpo_staff'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->applicant = User::factory()->create(['role_id' => $role('researcher_internal'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->coordinator = User::factory()->create(['role_id' => $role('department_coordinator'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->trainee = User::factory()->create(['role_id' => $role('ojt_trainee_internal'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->adviser = User::factory()->create(['role_id' => $role('adviser'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->programHead = User::factory()->create(['role_id' => $role('program_head'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->dean = User::factory()->create(['role_id' => $role('dean'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->secretariat = User::factory()->create(['role_id' => $role('ethics_secretariat'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->reviewer = User::factory()->create(['role_id' => $role('ethics_reviewer'), 'account_status' => 'active', 'email_verified_at' => now()]);
        $this->chair = User::factory()->create(['role_id' => $role('ethics_committee_chair'), 'account_status' => 'active', 'email_verified_at' => now()]);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private function makeResearchApplication(): ResearchApplication
    {
        return ResearchApplication::create([
            'applicant_id' => $this->applicant->id,
            'research_title' => 'Test Study '.uniqid(),
            'adviser_name' => 'Adam Adviser',
            'department' => 'CCS',
            'respondents' => 'Students',
            'target_respondent_count' => 50,
            'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form',
            'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonths(3)->toDateString(),
        ]);
    }

    private function makeDpreq(ResearchApplication $ra, string $status = 'submitted'): DpreqApplication
    {
        return DpreqApplication::create([
            'research_application_id' => $ra->id,
            'tracking_number' => 'DPREQ-2026-'.str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
            'applicant_id' => $this->applicant->id,
            'applicant_type' => 'internal_researcher',
            'department' => 'CCS',
            'purpose' => 'Academic research',
            'data_types' => ['demographic'],
            'data_subjects' => ['students'],
            'retention_plan' => '2 years.',
            'status' => $status,
        ]);
    }

    private function makeRemis(ResearchApplication $ra, string $status = 'draft_submitted'): RemisApplication
    {
        return RemisApplication::create([
            'research_application_id' => $ra->id,
            'tracking_number' => 'REC-2026-'.str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
            'applicant_id' => $this->applicant->id,
            'adviser_id' => $this->adviser->id,
            'study_type' => 'thesis_dissertation',
            'study_design' => 'quantitative',
            'target_population' => 'Students',
            'participant_count' => 50,
            'inclusion_criteria' => 'Enrolled.',
            'exclusion_criteria' => 'None.',
            'study_sites' => 'PCC',
            'risks_to_participants' => 'Minimal.',
            'benefits' => 'Knowledge.',
            'confidentiality_measures' => 'Anonymized.',
            'consent_process' => 'Written consent.',
            'data_storage_plan' => 'Encrypted.',
            'status' => $status,
        ]);
    }

    // ─── DPNDA Track ────────────────────────────────────────────────────────────

    /** @test */
    public function dpnda_full_lifecycle_draft_to_completed(): void
    {
        $this->actingAs($this->coordinator);
        $workflow = app(DpndaWorkflowService::class);

        $record = $workflow->createPlacement([
            'trainee_id' => $this->trainee->id,
            'trainee_last_name' => 'Doe',
            'trainee_first_name' => 'Jane',
            'enrolled_school' => 'PCC',
            'trainee_type' => 'internal_ojt',
            'department' => 'Registrar',
            'level' => 'Grade 12',
            'department_assigned' => 'Registrar',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ], $this->coordinator->id);

        $this->assertSame('draft', $record->status);

        $record = $workflow->sendForSigning($record);
        $this->assertSame('sent_for_signing', $record->status);

        $record = $workflow->traineeSign($record, 'Jane Doe');
        $this->assertSame('trainee_signed', $record->status);
        $this->assertNotNull($record->trainee_signed_at);

        $record = $workflow->coordinatorCountersign($record, 'Cathy Coordinator');
        $this->assertSame('completed', $record->status);
        $this->assertNotNull($record->coordinator_signed_at);
    }

    /** @test */
    public function dpnda_decline_is_terminal(): void
    {
        $this->actingAs($this->coordinator);
        $workflow = app(DpndaWorkflowService::class);

        $record = $workflow->createPlacement([
            'trainee_id' => $this->trainee->id,
            'trainee_last_name' => 'Doe',
            'trainee_first_name' => 'Jane',
            'enrolled_school' => 'PCC',
            'trainee_type' => 'internal_ojt',
            'department' => 'IT',
            'level' => '3rd Year',
            'department_assigned' => 'IT',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ], $this->coordinator->id);

        $workflow->sendForSigning($record);
        $record = $workflow->decline($record->fresh(), 'I do not agree to these terms.');

        $this->assertSame('declined', $record->status);
        $this->assertSame('I do not agree to these terms.', $record->decline_reason);

        // Cannot sign after declining.
        $this->expectException(RuntimeException::class);
        $workflow->traineeSign($record->fresh(), 'Jane Doe');
    }

    /** @test */
    public function dpnda_cannot_sign_twice(): void
    {
        $this->actingAs($this->coordinator);
        $workflow = app(DpndaWorkflowService::class);

        $record = $workflow->createPlacement([
            'trainee_id' => $this->trainee->id,
            'trainee_last_name' => 'Doe',
            'trainee_first_name' => 'Jane',
            'enrolled_school' => 'PCC',
            'trainee_type' => 'internal_ojt',
            'department' => 'Library',
            'level' => '4th Year',
            'department_assigned' => 'Library',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ], $this->coordinator->id);

        $workflow->sendForSigning($record);
        $workflow->traineeSign($record->fresh(), 'Jane Doe');

        // Second sign attempt must fail.
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Illegal DPNDA transition');
        $workflow->traineeSign($record->fresh(), 'Jane Doe Again');
    }

    /** @test */
    public function dpnda_cannot_countersign_before_trainee_signs(): void
    {
        $this->actingAs($this->coordinator);
        $workflow = app(DpndaWorkflowService::class);

        $record = $workflow->createPlacement([
            'trainee_id' => $this->trainee->id,
            'trainee_last_name' => 'Doe',
            'trainee_first_name' => 'Jane',
            'enrolled_school' => 'PCC',
            'trainee_type' => 'internal_ojt',
            'department' => 'GS',
            'level' => 'Grade 4',
            'department_assigned' => 'GS',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ], $this->coordinator->id);

        $workflow->sendForSigning($record);

        $this->expectException(RuntimeException::class);
        $workflow->coordinatorCountersign($record->fresh(), 'Cathy');
    }

    /** @test */
    public function dpnda_tracking_number_survives_soft_delete(): void
    {
        $this->actingAs($this->coordinator);
        $workflow = app(DpndaWorkflowService::class);

        $make = fn () => $workflow->createPlacement([
            'trainee_id' => $this->trainee->id,
            'trainee_last_name' => 'X',
            'trainee_first_name' => 'Y',
            'enrolled_school' => 'PCC',
            'trainee_type' => 'internal_ojt',
            'department' => 'Test',
            'level' => '1',
            'department_assigned' => 'Test',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ], $this->coordinator->id);

        $first = $make();
        $second = $make();

        // Soft-delete the first, then create a third — it must NOT reuse the first's number.
        $first->delete();
        $third = $make();

        $this->assertNotSame($first->tracking_number, $third->tracking_number);
        $this->assertNotSame($second->tracking_number, $third->tracking_number);
    }

    // ─── DPREQ Track ────────────────────────────────────────────────────────────

    /** @test */
    public function dpreq_return_and_resubmit_cycle(): void
    {
        $this->actingAs($this->dpo);
        $workflow = app(DpreqWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $app = $this->makeDpreq($ra);

        $workflow->startReview($app);
        $workflow->returnForCorrection($app->fresh(), 'Fix retention plan.');
        $this->assertSame('returned', $app->fresh()->status);

        $workflow->resubmit($app->fresh());
        $this->assertSame('submitted', $app->fresh()->status);

        // Can review again after resubmission.
        $workflow->startReview($app->fresh());
        $this->assertSame('under_review', $app->fresh()->status);
    }

    /** @test */
    public function dpreq_resubmit_is_blocked_by_outstanding_mandatory_revision(): void
    {
        $this->actingAs($this->dpo);
        $workflow = app(DpreqWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $app = $this->makeDpreq($ra);

        $workflow->startReview($app);
        $workflow->returnForCorrection($app->fresh(), 'Missing document.');

        // DPO raises a mandatory request while returned.
        app(RevisionService::class)->raise(
            $app->fresh(), $this->dpo, 'Supply the data-sharing agreement.', $this->applicant, 'document_required', true,
        );

        // Resubmit is blocked.
        try {
            $workflow->resubmit($app->fresh());
            $this->fail('Resubmit should have been blocked.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('outstanding required items', $e->getMessage());
        }
        $this->assertSame('returned', $app->fresh()->status);
    }

    /** @test */
    public function dpreq_rejected_is_terminal(): void
    {
        $this->actingAs($this->dpo);
        $workflow = app(DpreqWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $app = $this->makeDpreq($ra);

        $workflow->startReview($app);
        $workflow->reject($app->fresh(), 'Insufficient basis.');
        $this->assertSame('rejected', $app->fresh()->status);

        // Cannot do anything from rejected.
        $this->expectException(RuntimeException::class);
        $workflow->startReview($app->fresh());
    }

    /** @test */
    public function dpreq_cannot_approve_from_submitted_directly(): void
    {
        $workflow = app(DpreqWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $app = $this->makeDpreq($ra, 'submitted');

        // Must go through under_review first.
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Illegal DPREQ transition');
        $workflow->approve($app, $this->dpo->id);
    }

    // ─── REMIS Track ────────────────────────────────────────────────────────────

    /** @test */
    public function remis_full_endorsement_chain_advances_to_screening(): void
    {
        $this->actingAs($this->applicant);
        $workflow = app(RemisWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra);

        $workflow->submit($remis);
        $remis = $remis->fresh();
        $this->assertSame('under_endorsement', $remis->status);
        $this->assertSame('adviser', $remis->current_endorsement_step);

        $workflow->endorse($remis, 'adviser', $this->adviser->id, 'approve', 'Good.', 'Adviser Sig');
        $remis = $remis->fresh();
        $this->assertSame('program_head', $remis->current_endorsement_step);

        $workflow->endorse($remis, 'program_head', $this->programHead->id, 'approve', 'Endorsed.', 'PH Sig');
        $remis = $remis->fresh();
        $this->assertSame('dean', $remis->current_endorsement_step);

        $workflow->endorse($remis, 'dean', $this->dean->id, 'approve', 'Final endorsement.', 'Dean Sig');
        $remis = $remis->fresh();
        $this->assertSame('for_screening', $remis->status);
        $this->assertNull($remis->current_endorsement_step);
    }

    /** @test */
    public function remis_endorsement_reject_is_terminal_disapproved(): void
    {
        $this->actingAs($this->applicant);
        $workflow = app(RemisWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra);

        $workflow->submit($remis);
        $workflow->endorse($remis->fresh(), 'adviser', $this->adviser->id, 'reject', 'Not viable.', 'Sig');

        $this->assertSame('disapproved', $remis->fresh()->status);

        // Terminal — cannot transition further.
        $this->expectException(RuntimeException::class);
        $workflow->resubmitFromRevision($remis->fresh());
    }

    /** @test */
    public function remis_wrong_endorser_cannot_act_out_of_turn(): void
    {
        $this->actingAs($this->applicant);
        $workflow = app(RemisWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra);

        $workflow->submit($remis);

        // Dean tries to endorse at the adviser step — must fail.
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("not currently the dean's turn");
        $workflow->endorse($remis->fresh(), 'dean', $this->dean->id, 'approve', 'Skipping ahead.', 'Sig');
    }

    /** @test */
    public function remis_screening_rejects_wrong_status(): void
    {
        $workflow = app(RemisWorkflowService::class);
        $ra = $this->makeResearchApplication();
        // Create in under_endorsement (not for_screening).
        $remis = $this->makeRemis($ra, 'under_endorsement');
        $remis->update(['current_endorsement_step' => 'adviser']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Illegal REMIS transition');
        $workflow->screen($remis, 'complete');
    }

    /** @test */
    public function remis_screening_on_wrong_status_creates_no_checklist(): void
    {
        $workflow = app(RemisWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'under_endorsement');
        $remis->update(['current_endorsement_step' => 'adviser']);

        try {
            $workflow->screen($remis, 'complete');
        } catch (RuntimeException) {
            // expected
        }

        $this->assertDatabaseMissing('screening_checklists', [
            'remis_application_id' => $remis->id,
        ]);
    }

    /** @test */
    public function remis_decide_requires_all_reviewers_submitted(): void
    {
        $this->actingAs($this->chair);
        $workflow = app(RemisWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'for_review');

        // Assign two reviewers; only one submits.
        $a1 = $workflow->assignReviewer($remis, $this->reviewer->id);
        $reviewer2 = User::factory()->create(['role_id' => Role::where('name', 'ethics_reviewer')->value('id'), 'account_status' => 'active']);
        $workflow->assignReviewer($remis, $reviewer2->id);

        $workflow->classifyRiskAndRecommend($a1, 'minimal', 'Low risk.', 'approve', 'Fine.');

        // Chair tries to decide — blocked because reviewer2 hasn't submitted.
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('All assigned reviewers must submit');
        $workflow->decide($remis->fresh(), 'approved', $this->chair->id, null, 'Approved.', 'Chair Sig');
    }

    /** @test */
    public function remis_deferred_can_be_reactivated(): void
    {
        $this->actingAs($this->chair);
        $workflow = app(RemisWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'for_review');

        $a = $workflow->assignReviewer($remis, $this->reviewer->id);
        $workflow->classifyRiskAndRecommend($a, 'moderate', 'Needs more info.', 'major_revision', 'Defer.');

        $workflow->decide($remis->fresh(), 'deferred', $this->chair->id, null, 'Deferred.', 'Sig');
        $this->assertSame('deferred', $remis->fresh()->status);

        $workflow->reactivateFromDeferred($remis->fresh());
        $this->assertSame('for_review', $remis->fresh()->status);
    }

    /** @test */
    public function remis_revision_from_review_resubmits_to_review_not_endorsement(): void
    {
        $this->actingAs($this->chair);
        $workflow = app(RemisWorkflowService::class);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'for_review');

        $a = $workflow->assignReviewer($remis, $this->reviewer->id);
        $workflow->classifyRiskAndRecommend($a, 'moderate', 'Minor issues.', 'minor_revision', 'Fix consent.');

        $workflow->decide($remis->fresh(), 'for_revision', $this->chair->id, null, 'Minor revision.', 'Sig');
        $remis = $remis->fresh();
        $this->assertSame('for_revision', $remis->status);
        $this->assertSame('for_review', $remis->returned_from_status);

        // Resubmit goes back to for_review, not under_endorsement.
        $this->actingAs($this->applicant);
        $workflow->resubmitFromRevision($remis);
        $this->assertSame('for_review', $remis->fresh()->status);
    }

    // ─── Incident + Monitoring ──────────────────────────────────────────────────

    /** @test */
    public function incident_data_breach_auto_pauses_monitoring(): void
    {
        $this->actingAs($this->secretariat);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'monitoring');

        $incident = app(IncidentService::class)->file($remis, [
            'incident_type' => 'data_breach',
            'severity' => 'high',
            'incident_date' => now()->toDateString(),
            'description' => 'Spreadsheet shared incorrectly.',
        ], $this->secretariat->id);

        $this->assertSame('reported', $incident->status);
        $this->assertSame('monitoring_paused', $remis->fresh()->status);
    }

    /** @test */
    public function incident_non_breach_does_not_pause_monitoring(): void
    {
        $this->actingAs($this->secretariat);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'monitoring');

        app(IncidentService::class)->file($remis, [
            'incident_type' => 'participant_complaint',
            'severity' => 'low',
            'incident_date' => now()->toDateString(),
            'description' => 'A question about data usage.',
        ], $this->secretariat->id);

        $this->assertSame('monitoring', $remis->fresh()->status);
    }

    /** @test */
    public function monitoring_resumes_after_incident(): void
    {
        $this->actingAs($this->chair);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'monitoring_paused');

        app(RemisWorkflowService::class)->resumeMonitoring($remis, $this->chair->id);
        $this->assertSame('monitoring', $remis->fresh()->status);
    }

    /** @test */
    public function completion_report_closes_and_archives(): void
    {
        $this->actingAs($this->applicant);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'monitoring');

        $completion = app(RemisMonitoringService::class)->submitCompletionReport($remis, [
            'completion_date' => now()->toDateString(),
            'final_participant_count' => 100,
            'compliance_statement' => 'Fully compliant.',
            'publication_status' => 'Published.',
            'data_storage_location' => 'Cloud.',
        ], $this->applicant->id);

        $this->assertSame('archived', $remis->fresh()->status);
        $this->assertNotNull($completion->archived_at);
    }

    /** @test */
    public function progress_report_rejected_outside_monitoring(): void
    {
        $this->actingAs($this->applicant);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'for_review');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('only be submitted while the study is in Monitoring');
        app(RemisMonitoringService::class)->submitProgressReport($remis, [
            'status_of_study' => 'Ongoing.',
            'participants_recruited' => 10,
        ], $this->applicant->id);
    }

    // ─── Incident lifecycle ─────────────────────────────────────────────────────

    /** @test */
    public function incident_full_lifecycle_reported_to_closed(): void
    {
        $this->actingAs($this->secretariat);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'monitoring');
        $service = app(IncidentService::class);

        $incident = $service->file($remis, [
            'incident_type' => 'protocol_violation',
            'severity' => 'medium',
            'incident_date' => now()->toDateString(),
            'description' => 'Deviation from approved protocol.',
        ], $this->secretariat->id);

        $incident = $service->transition($incident, 'under_investigation');
        $this->assertSame('under_investigation', $incident->status);

        $incident = $service->transition($incident, 'resolved');
        $this->assertSame('resolved', $incident->status);

        $incident = $service->transition($incident, 'closed');
        $this->assertSame('closed', $incident->status);

        // Terminal.
        $this->expectException(RuntimeException::class);
        $service->transition($incident->fresh(), 'reported');
    }

    /** @test */
    public function incident_cannot_skip_investigation(): void
    {
        $this->actingAs($this->secretariat);
        $ra = $this->makeResearchApplication();
        $remis = $this->makeRemis($ra, 'monitoring');
        $service = app(IncidentService::class);

        $incident = $service->file($remis, [
            'incident_type' => 'participant_complaint',
            'severity' => 'low',
            'incident_date' => now()->toDateString(),
            'description' => 'Complaint.',
        ], $this->secretariat->id);

        // Cannot jump from reported to resolved.
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Illegal incident transition');
        $service->transition($incident, 'resolved');
    }
}
