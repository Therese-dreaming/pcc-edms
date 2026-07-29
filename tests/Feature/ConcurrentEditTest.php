<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Auth\Models\Role;
use App\Shared\Concurrency\Exceptions\StaleRecordException;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConcurrentEditTest extends TestCase
{
    use RefreshDatabase;

    private User $chair;
    private RemisApplication $application;

    protected function setUp(): void
    {
        parent::setUp();

        $chairRole = Role::create(['name' => 'ethics_committee_chair', 'side' => 'remis']);

        $this->chair = User::factory()->create([
            'role_id' => $chairRole->id,
            'account_status' => 'active',
        ]);

        $researchApplication = ResearchApplication::create([
            'applicant_id' => $this->chair->id,
            'research_title' => 'A Study on Concurrent Review Decisions',
            'adviser_name' => 'Dr. Adviser',
            'respondents' => 'Undergraduate students',
            'target_respondent_count' => 120,
            'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form',
            'target_start_date' => '2026-01-05',
            'target_end_date' => '2026-06-30',
        ]);

        $this->application = RemisApplication::create([
            'research_application_id' => $researchApplication->id,
            'tracking_number' => 'REMIS-2026-000001',
            'applicant_id' => $this->chair->id,
            'study_type' => 'thesis_dissertation',
            'study_design' => 'quantitative',
            'target_population' => 'Undergraduate students on the main campus',
            'participant_count' => 120,
            'inclusion_criteria' => 'Enrolled undergraduates aged 18 and above.',
            'exclusion_criteria' => 'Minors and non-enrolled participants.',
            'study_sites' => 'Main campus',
            'risks_to_participants' => 'Minimal — survey fatigue only.',
            'benefits' => 'Informs student support policy.',
            'confidentiality_measures' => 'Responses anonymised before analysis.',
            'consent_process' => 'Written informed consent collected before the survey.',
            'data_storage_plan' => 'Encrypted drive, destroyed three years after completion.',
            'status' => 'for_review',
        ]);
    }

    /** @test */
    public function optimistic_locking_prevents_overwrite()
    {
        // Both users load the same application (same version).
        $app1 = RemisApplication::find($this->application->id);
        $app2 = RemisApplication::find($this->application->id);

        // User 2 saves first — this bumps `version`.
        $app2->status = 'approved';
        $app2->save();

        $this->assertSame((int) $app1->version + 1, (int) $app2->fresh()->version);

        // User 1 now saves from the stale copy: must be rejected, not silently applied.
        $app1->status = 'approved_with_conditions';

        $this->expectException(StaleRecordException::class);

        try {
            $app1->save();
        } finally {
            // User 2's decision must survive intact.
            $this->assertSame('approved', $this->application->fresh()->status);
        }
    }

    /** @test */
    public function stale_save_is_allowed_once_the_record_is_refreshed()
    {
        $app1 = RemisApplication::find($this->application->id);

        RemisApplication::where('id', $this->application->id)->update(['version' => 99]);

        // Refreshing picks up the current version, so the retry succeeds.
        $app1->refresh();
        $app1->status = 'approved';
        $app1->save();

        $this->assertSame('approved', $this->application->fresh()->status);
        $this->assertSame(100, (int) $this->application->fresh()->version);
    }

    /** @test */
    public function controller_returns_friendly_error_on_lock_conflict()
    {
        $staleVersion = (int) $this->application->version;

        // Another user acts on the application after this page was rendered.
        RemisApplication::where('id', $this->application->id)
            ->update(['version' => $staleVersion + 1]);

        // The chair submits a decision from the now-outdated page.
        $response = $this->actingAs($this->chair)->post(
            route('remis.decide', $this->application->id),
            [
                'outcome' => 'approved_with_conditions',
                'signature' => 'Connie Chair',
                'expected_version' => $staleVersion,
            ],
        );

        $response->assertSessionHasErrors('decide');
        $this->assertStringContainsString(
            'modified by another user',
            session('errors')->first('decide'),
        );

        // No decision may be recorded from a stale submission.
        $this->assertSame('for_review', $this->application->fresh()->status);
        $this->assertDatabaseCount('decisions', 0);
    }
}