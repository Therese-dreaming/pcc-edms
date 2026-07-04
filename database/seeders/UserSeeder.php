<?php

namespace Database\Seeders;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use Illuminate\Database\Seeder;

// Test accounts for manually exercising the DPREQ, DPNDA, and REMIS golden paths
// (docs/1.2, docs/2.2, docs/3.3). Password for every seeded account: "password".
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['name' => 'Rosa Researcher', 'email' => 'researcher@pcc.test', 'role' => 'researcher_internal'],
            ['name' => 'Dan DPO Staff', 'email' => 'dpo.staff@pcc.test', 'role' => 'dpo_staff'],
            ['name' => 'Ana DPO Approver', 'email' => 'dpo.approver@pcc.test', 'role' => 'dpo_approver'],
            ['name' => 'Sam Admin', 'email' => 'admin@pcc.test', 'role' => 'system_administrator'],
            ['name' => 'Cathy Coordinator', 'email' => 'coordinator@pcc.test', 'role' => 'department_coordinator'],
            ['name' => 'Toby Trainee', 'email' => 'trainee@pcc.test', 'role' => 'ojt_trainee_internal'],
            ['name' => 'Adam Adviser', 'email' => 'adviser@pcc.test', 'role' => 'adviser'],
            ['name' => 'Paula Program Head', 'email' => 'programhead@pcc.test', 'role' => 'program_head'],
            ['name' => 'Danilo Dean', 'email' => 'dean@pcc.test', 'role' => 'dean'],
            ['name' => 'Erin Secretariat', 'email' => 'secretariat@pcc.test', 'role' => 'ethics_secretariat'],
            ['name' => 'Rex Reviewer', 'email' => 'reviewer@pcc.test', 'role' => 'ethics_reviewer'],
            ['name' => 'Connie Chair', 'email' => 'chair@pcc.test', 'role' => 'ethics_committee_chair'],
        ];

        foreach ($accounts as $account) {
            $roleId = Role::where('name', $account['role'])->value('id');

            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => 'password',
                    'role_id' => $roleId,
                    'account_status' => 'active',
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
