<?php

namespace Tests\Feature;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use App\Shared\AuditLog\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $dpoStaff;
    private User $ethicsChair;
    private User $researcher;
    private User $adviser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::create(['name' => 'system_administrator', 'side' => 'shared']);
        $dpoRole = Role::create(['name' => 'dpo_staff', 'side' => 'dpo']);
        $chairRole = Role::create(['name' => 'ethics_committee_chair', 'side' => 'remis']);
        $researcherRole = Role::create(['name' => 'researcher', 'side' => 'remis']);
        $adviserRole = Role::create(['name' => 'adviser', 'side' => 'remis']);

        $this->admin = User::factory()->create(['role_id' => $adminRole->id, 'account_status' => 'active']);
        $this->dpoStaff = User::factory()->create(['role_id' => $dpoRole->id, 'account_status' => 'active']);
        $this->ethicsChair = User::factory()->create(['role_id' => $chairRole->id, 'account_status' => 'active']);
        $this->researcher = User::factory()->create(['role_id' => $researcherRole->id, 'account_status' => 'active']);
        $this->adviser = User::factory()->create(['role_id' => $adviserRole->id, 'account_status' => 'active']);

        // Create some audit logs
        AuditLog::create([
            'user_id' => $this->researcher->id,
            'event_type' => 'remis_application.created',
            'auditable_type' => 'App\\Modules\\Remis\\Models\\RemisApplication',
            'auditable_id' => 1,
            'old_value' => null,
            'new_value' => ['status' => 'draft_submitted'],
        ]);
    }

    /** @test */
    public function admin_can_access_audit_trail()
    {
        $this->actingAs($this->admin)
            ->get(route('admin.audit-trail.index'))
            ->assertStatus(200);
    }

    /** @test */
    public function dpo_staff_can_access_audit_trail()
    {
        $this->actingAs($this->dpoStaff)
            ->get(route('admin.audit-trail.index'))
            ->assertStatus(200);
    }

    /** @test */
    public function ethics_committee_chair_can_access_audit_trail()
    {
        $this->actingAs($this->ethicsChair)
            ->get(route('admin.audit-trail.index'))
            ->assertStatus(200);
    }

    /** @test */
    public function researcher_cannot_access_audit_trail()
    {
        $this->actingAs($this->researcher)
            ->get(route('admin.audit-trail.index'))
            ->assertForbidden();
    }

    /** @test */
    public function adviser_cannot_access_audit_trail()
    {
        $this->actingAs($this->adviser)
            ->get(route('admin.audit-trail.index'))
            ->assertForbidden();
    }
}