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
            'email' => 'ext.adviser@school.test',
            'institution' => 'PLP',
            'purpose' => 'I supervise MAED students researching at PCC.',
        ])->assertRedirect();

        $this->assertDatabaseHas('adviser_account_requests', [
            'email' => 'ext.adviser@school.test',
            'status' => 'pending',
        ]);
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
