<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Dpnda\Models\DpndaRecord;
use App\Modules\Dpnda\Models\Placement;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Auth\Models\Role;
use App\Shared\Clearance\Models\ClearanceCertificate;
use App\Shared\Documents\Services\RetentionService;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// 2026-08-31 audit — retention sweep bucketing. A study whose certificate issued long ago is an
// ISSUED record on the 7-year schedule even though it sits archived (previously it fell into the
// 3-year rejected bucket); disapproved/declined records take the 3-year schedule; DPNDA records
// are swept at all now (docs/9.1: DPREQ/DPNDA do not differ).
class RetentionBucketTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        $this->user = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
        ]);
    }

    private function makeRemis(string $trackingNumber, string $status): RemisApplication
    {
        $ra = ResearchApplication::create([
            'applicant_id' => $this->user->id,
            'research_title' => "Study {$trackingNumber}",
            'adviser_name' => 'Adam',
            'department' => 'CCS',
            'respondents' => 'Students',
            'target_respondent_count' => 50,
            'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form',
            'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonths(3)->toDateString(),
        ]);

        return RemisApplication::create([
            'research_application_id' => $ra->id,
            'tracking_number' => $trackingNumber,
            'applicant_id' => $this->user->id,
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
            'status' => $status,
        ]);
    }

    private function backdateUpdatedAt($model, int $years): void
    {
        $model->forceFill(['updated_at' => now()->subYears($years)])->saveQuietly();
    }

    /** @test */
    public function an_archived_study_with_an_old_certificate_is_issued_not_rejected(): void
    {
        $remis = $this->makeRemis('REC-2018-0001', 'archived');
        ClearanceCertificate::create([
            'research_application_id' => $remis->research_application_id,
            'remis_certificate_number' => 'REMIS-2018-000001',
            'remis_certificate_kind' => 'clearance',
            'remis_issued_at' => now()->subYears(8),
        ]);
        $this->backdateUpdatedAt($remis, 8);

        // A fresh archived study — same terminal status, recent certificate — must not be eligible.
        $recent = $this->makeRemis('REC-2024-0001', 'archived');
        ClearanceCertificate::create([
            'research_application_id' => $recent->research_application_id,
            'remis_certificate_number' => 'REMIS-2024-000001',
            'remis_certificate_kind' => 'clearance',
            'remis_issued_at' => now()->subYears(2),
        ]);
        $this->backdateUpdatedAt($recent, 2);

        $eligible = app(RetentionService::class)->eligibleForPurge();

        $this->assertTrue($eligible['issued']->pluck('label')->contains('REC-2018-0001'));
        $this->assertFalse($eligible['rejected']->pluck('label')->contains('REC-2018-0001'));
        $this->assertFalse($eligible['issued']->pluck('label')->contains('REC-2024-0001'));
        $this->assertFalse($eligible['rejected']->pluck('label')->contains('REC-2024-0001'));
    }

    /** @test */
    public function a_disapproved_study_takes_the_rejected_schedule(): void
    {
        $remis = $this->makeRemis('REC-2022-0002', 'disapproved');
        $this->backdateUpdatedAt($remis, 4);

        $eligible = app(RetentionService::class)->eligibleForPurge();

        $this->assertTrue($eligible['rejected']->pluck('label')->contains('REC-2022-0002'));
        $this->assertFalse($eligible['issued']->pluck('label')->contains('REC-2022-0002'));
    }

    /** @test */
    public function dpnda_records_are_swept_on_the_same_schedule(): void
    {
        $placement = Placement::create([
            'trainee_id' => $this->user->id,
            'trainee_last_name' => 'Dela Cruz',
            'trainee_first_name' => 'Juan',
            'enrolled_school' => 'PCC',
            'trainee_type' => 'internal_ojt',
            'department_assigned' => 'Registrar',
            'start_date' => now()->subMonths(2)->toDateString(),
            'end_date' => now()->toDateString(),
            'coordinator_id' => $this->user->id,
        ]);

        $completed = DpndaRecord::create([
            'placement_id' => $placement->id,
            'tracking_number' => 'DPNDA-2018-0001',
            'status' => 'completed',
        ]);
        $this->backdateUpdatedAt($completed, 8);

        $declined = DpndaRecord::create([
            'placement_id' => $placement->id,
            'tracking_number' => 'DPNDA-2022-0002',
            'status' => 'declined',
        ]);
        $this->backdateUpdatedAt($declined, 4);

        $eligible = app(RetentionService::class)->eligibleForPurge();

        $this->assertTrue($eligible['issued']->pluck('label')->contains('DPNDA-2018-0001'));
        $this->assertTrue($eligible['rejected']->pluck('label')->contains('DPNDA-2022-0002'));
    }
}
