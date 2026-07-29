<?php

namespace Tests\Feature;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use App\Shared\Dashboard\Services\EndorserDashboardService;
use App\Shared\Notifications\Models\Notification;
use App\Shared\Onboarding\Services\CohortService;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

// Verifies the "route applications to their owning adviser" work: adviser_id is populated from the
// applicant's cohort, endorsement notifications target that one adviser instead of broadcasting to
// every adviser, and the endorser dashboard is scoped per adviser. Also confirms the retired
// standalone Create Applicant form is gone.
class AdviserRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->seed(RoleSeeder::class);
    }

    private function makeAdviser(string $email): User
    {
        return User::factory()->create([
            'role_id' => Role::where('name', 'adviser')->value('id'),
            'email' => $email,
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    private function makeResearcher(string $email): User
    {
        return User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'email' => $email,
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    private function enrol(User $adviser, User $researcher): void
    {
        $cohort = app(CohortService::class)->create([
            'name' => 'Test Class',
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
        ], $adviser);

        $cohort->members()->create([
            'user_id' => $researcher->id,
            'full_name' => $researcher->name,
            'email' => $researcher->email,
            'status' => 'joined',
            'joined_at' => now(),
        ]);
    }

    private function submitFor(User $applicant): \App\Modules\Dpreq\Models\DpreqApplication
    {
        Auth::onceUsingId($applicant->id);

        return app(ResearchApplicationService::class)->submitForm1([
            'research_title' => 'A Study',
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
        ], $applicant);
    }

    /** @test */
    public function submission_sets_adviser_id_from_the_applicants_cohort(): void
    {
        $adviser = $this->makeAdviser('adviser1@pcc.test');
        $researcher = $this->makeResearcher('r1@pcc.test');
        $this->enrol($adviser, $researcher);

        $dpreq = $this->submitFor($researcher);
        $remis = $dpreq->researchApplication->remisApplication;

        $this->assertSame($adviser->id, $remis->adviser_id);
    }

    /** @test */
    public function submission_by_a_cohort_less_applicant_leaves_adviser_id_null(): void
    {
        $researcher = $this->makeResearcher('loner@pcc.test');

        $dpreq = $this->submitFor($researcher);

        $this->assertNull($dpreq->researchApplication->remisApplication->adviser_id);
    }

    /** @test */
    public function endorsement_notifies_only_the_owning_adviser_not_every_adviser(): void
    {
        $owner = $this->makeAdviser('owner@pcc.test');
        $bystander = $this->makeAdviser('bystander@pcc.test');
        $researcher = $this->makeResearcher('r2@pcc.test');
        $this->enrol($owner, $researcher);

        $this->submitFor($researcher);

        $this->assertSame(1, Notification::where('user_id', $owner->id)->count());
        $this->assertSame(0, Notification::where('user_id', $bystander->id)->count());
    }

    /** @test */
    public function a_cohort_less_submission_still_broadcasts_to_all_advisers(): void
    {
        $a1 = $this->makeAdviser('a1@pcc.test');
        $a2 = $this->makeAdviser('a2@pcc.test');
        $researcher = $this->makeResearcher('r3@pcc.test');

        $this->submitFor($researcher);

        // No owning adviser, so the fallback role-broadcast reaches every active adviser.
        $this->assertSame(1, Notification::where('user_id', $a1->id)->count());
        $this->assertSame(1, Notification::where('user_id', $a2->id)->count());
    }

    /** @test */
    public function the_endorser_dashboard_is_scoped_to_the_owning_adviser(): void
    {
        $owner = $this->makeAdviser('owner2@pcc.test');
        $other = $this->makeAdviser('other2@pcc.test');
        $researcher = $this->makeResearcher('r4@pcc.test');
        $this->enrol($owner, $researcher);

        $dpreq = $this->submitFor($researcher);
        $tracking = $dpreq->researchApplication->remisApplication->tracking_number;

        $service = app(EndorserDashboardService::class);

        $ownerLabels = collect($service->widgets($owner)['awaiting_my_endorsement']['items'])->pluck('label');
        $otherLabels = collect($service->widgets($other)['awaiting_my_endorsement']['items'])->pluck('label');

        $this->assertTrue($ownerLabels->contains($tracking));
        $this->assertFalse($otherLabels->contains($tracking));
    }

    /** @test */
    public function a_cohort_less_application_stays_visible_to_advisers_in_the_dashboard(): void
    {
        $adviser = $this->makeAdviser('anyadviser@pcc.test');
        $researcher = $this->makeResearcher('r5@pcc.test');

        // No cohort -> adviser_id null. The unassigned pool must remain actionable by any adviser.
        $dpreq = $this->submitFor($researcher);
        $tracking = $dpreq->researchApplication->remisApplication->tracking_number;

        $labels = collect(app(EndorserDashboardService::class)->widgets($adviser)['awaiting_my_endorsement']['items'])->pluck('label');

        $this->assertTrue($labels->contains($tracking));
    }

    /** @test */
    public function the_retired_create_applicant_route_is_gone(): void
    {
        $admin = User::factory()->create([
            'role_id' => Role::where('name', 'system_administrator')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($admin)->get('/adviser/applicants/create')->assertNotFound();
    }

    /** @test */
    public function cohort_update_persists_changes(): void
    {
        $adviser = $this->makeAdviser('editor@pcc.test');
        $cohort = app(CohortService::class)->create([
            'name' => 'Old Name',
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'max_members' => 10,
        ], $adviser);

        app(CohortService::class)->update($cohort, [
            'name' => 'New Name',
            'max_members' => 40,
            'expires_at' => now()->addMonth()->toDateString(),
            'allowed_email_domains' => ['pcc.edu.ph'],
        ]);

        $cohort->refresh();
        $this->assertSame('New Name', $cohort->name);
        $this->assertSame(40, $cohort->max_members);
        $this->assertSame(['pcc.edu.ph'], $cohort->allowed_email_domains);
    }
}
