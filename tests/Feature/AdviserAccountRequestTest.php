<?php

namespace Tests\Feature;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use App\Shared\Onboarding\Models\AdviserAccountRequest;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

// Stakeholder 2026-07-28 — external advisers request an account; the DPO approves it, which creates
// their adviser account.
class AdviserAccountRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Notification::fake();
        $this->seed(RoleSeeder::class);
    }

    private function dpoStaff(): User
    {
        return User::factory()->create([
            'role_id' => Role::where('name', 'dpo_staff')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    /** @test */
    public function a_guest_can_submit_an_adviser_account_request(): void
    {
        $this->post(route('adviser-request.store'), [
            'name' => 'Dr. Ext Adviser',
            'account_type' => 'external_adviser',
            'email' => 'ext.adviser@school.test',
            'institution' => 'PLP',
            'purpose' => 'I supervise MAED students researching at PCC.',
        ])->assertRedirect();

        $this->assertDatabaseHas('adviser_account_requests', [
            'email' => 'ext.adviser@school.test',
            'account_type' => 'external_adviser',
            'status' => 'pending',
        ]);
    }

    /** @test */
    public function a_guest_can_request_an_employee_researcher_account(): void
    {
        $this->post(route('adviser-request.store'), [
            'name' => 'Prof Employee Researcher',
            'account_type' => 'employee_researcher',
            'email' => 'faculty.researcher@pcc.test',
            'purpose' => 'Faculty member in the College of Education conducting institutional research.',
        ])->assertRedirect();

        $this->assertDatabaseHas('adviser_account_requests', [
            'email' => 'faculty.researcher@pcc.test',
            'account_type' => 'employee_researcher',
            'status' => 'pending',
        ]);
    }

    /** @test */
    public function the_account_type_is_required(): void
    {
        $this->post(route('adviser-request.store'), [
            'name' => 'No Type',
            'email' => 'no.type@pcc.test',
            'purpose' => 'Missing the account type.',
        ])->assertSessionHasErrors('account_type');
    }

    /** @test */
    public function approving_an_employee_request_creates_a_researcher_internal_account(): void
    {
        $req = AdviserAccountRequest::create([
            'name' => 'Prof Employee Researcher',
            'account_type' => 'employee_researcher',
            'email' => 'faculty.researcher@pcc.test',
            'department' => 'College of Education',
            'purpose' => 'Institutional research.',
        ]);

        $this->actingAs($this->dpoStaff())
            ->post(route('admin.adviser-requests.approve', $req->id))
            ->assertRedirect();

        $user = User::where('email', 'faculty.researcher@pcc.test')->first();
        $this->assertNotNull($user);
        $this->assertSame(Role::where('name', 'researcher_internal')->value('id'), $user->role_id);
        // Tagged as an employee so the DPREQ/REMIS intake derives the category and drops the selector.
        $this->assertSame('employee', $user->applicant_category);
        $this->assertSame('employee', $user->applicantCategory());
    }

    /** @test */
    public function approving_a_request_creates_an_adviser_account(): void
    {
        $req = AdviserAccountRequest::create([
            'name' => 'Dr. Ext Adviser',
            'email' => 'ext.adviser@school.test',
            'institution' => 'PLP',
            'purpose' => 'Supervising external researchers.',
        ]);

        $this->actingAs($this->dpoStaff())
            ->post(route('admin.adviser-requests.approve', $req->id))
            ->assertRedirect();

        $adviserRoleId = Role::where('name', 'adviser')->value('id');
        $user = User::where('email', 'ext.adviser@school.test')->first();
        $this->assertNotNull($user);
        $this->assertSame($adviserRoleId, $user->role_id);
        $this->assertDatabaseHas('adviser_account_requests', [
            'id' => $req->id,
            'status' => 'approved',
            'created_user_id' => $user->id,
        ]);
    }

    /** @test */
    public function a_non_reviewer_cannot_review_requests(): void
    {
        $researcher = User::factory()->create([
            'role_id' => Role::where('name', 'researcher_internal')->value('id'),
            'account_status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($researcher)
            ->get(route('admin.adviser-requests.index'))
            ->assertForbidden();
    }
}
