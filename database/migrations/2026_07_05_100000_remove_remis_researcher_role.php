<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// A researcher is researcher_internal/researcher_external on both the DPO and REMIS sides —
// there's no separate "remis_researcher" role (see database/seeders/RoleSeeder.php). Any user
// still holding it is bumped to researcher_internal rather than left with a dangling role, since
// that's the safer default (an admin can re-assign to external if that's what they actually are).
return new class extends Migration
{
    public function up(): void
    {
        $remisResearcherId = DB::table('roles')->where('name', 'remis_researcher')->value('id');

        if ($remisResearcherId !== null) {
            $researcherInternalId = DB::table('roles')->where('name', 'researcher_internal')->value('id');

            DB::table('users')->where('role_id', $remisResearcherId)->update(['role_id' => $researcherInternalId]);
            DB::table('roles')->where('id', $remisResearcherId)->delete();
        }
    }

    public function down(): void
    {
        DB::table('roles')->updateOrInsert(['name' => 'remis_researcher'], ['name' => 'remis_researcher', 'side' => 'remis']);
    }
};
