<?php

namespace Database\Seeders;

use App\Shared\Auth\Models\Role;
use Illuminate\Database\Seeder;

// docs/0.2-stakeholders-and-roles.md — full role list (DPO-side + REMIS-side + Admin).
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            // DPO-side
            ['name' => 'researcher_internal', 'side' => 'dpo'],
            ['name' => 'researcher_external', 'side' => 'dpo'],
            ['name' => 'ojt_trainee_internal', 'side' => 'dpo'],
            ['name' => 'ojt_trainee_external', 'side' => 'dpo'],
            ['name' => 'student_teacher', 'side' => 'dpo'],
            ['name' => 'department_coordinator', 'side' => 'dpo'],
            ['name' => 'dpo_staff', 'side' => 'dpo'],
            ['name' => 'dpo_approver', 'side' => 'dpo'],
            // REMIS-side
            ['name' => 'remis_researcher', 'side' => 'remis'],
            ['name' => 'adviser', 'side' => 'remis'],
            ['name' => 'program_head', 'side' => 'remis'],
            ['name' => 'dean', 'side' => 'remis'],
            ['name' => 'ethics_secretariat', 'side' => 'remis'],
            ['name' => 'ethics_reviewer', 'side' => 'remis'],
            ['name' => 'ethics_committee_chair', 'side' => 'remis'],
            // Shared
            ['name' => 'system_administrator', 'side' => 'shared'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['name' => $role['name']], $role);
        }
    }
}
