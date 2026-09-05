<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The public request flow originally only served external advisers (2026-07-28). Generalized
// 2026-09-05 so account-less employee/faculty researchers can request their own account too — the
// gap being that cohorts are student+adviser oriented and left employees with no self-service path.
// `account_type` decides which role approval assigns: external_adviser → `adviser`,
// employee_researcher → `researcher_internal` (with applicant_category 'employee'). Default keeps
// existing rows valid as adviser requests.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adviser_account_requests', function (Blueprint $table) {
            $table->enum('account_type', ['external_adviser', 'employee_researcher'])
                ->default('external_adviser')->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('adviser_account_requests', function (Blueprint $table) {
            $table->dropColumn('account_type');
        });
    }
};
