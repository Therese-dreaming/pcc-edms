<?php

namespace Tests\Feature;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Admin › Users index Actions menu — bulk account-status changes (activate / suspend / deactivate).
class AdminUserBulkStatusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function user(string $role, string $status = 'active'): User
    {
        return User::factory()->create(['role_id' => Role::where('name', $role)->value('id'), 'account_status' => $status, 'email_verified_at' => now()]);
    }

    /** @test */
    public function admin_bulk_deactivates_accounts_but_never_their_own(): void
    {
        $admin = $this->user('system_administrator');
        $a = $this->user('researcher_internal');
        $b = $this->user('researcher_internal');

        $this->actingAs($admin)
            ->post(route('admin.users.bulk-status'), ['ids' => [$a->id, $b->id, $admin->id], 'account_status' => 'deactivated'])
            ->assertRedirect();

        $this->assertSame('deactivated', $a->fresh()->account_status);
        $this->assertSame('deactivated', $b->fresh()->account_status);
        // The acting admin's own status is untouched (self-lockout guard).
        $this->assertSame('active', $admin->fresh()->account_status);
    }

    /** @test */
    public function a_non_admin_cannot_bulk_change_status(): void
    {
        $staff = $this->user('dpo_staff');
        $target = $this->user('researcher_internal');

        $this->actingAs($staff)
            ->post(route('admin.users.bulk-status'), ['ids' => [$target->id], 'account_status' => 'suspended'])
            ->assertForbidden();

        $this->assertSame('active', $target->fresh()->account_status);
    }
}
