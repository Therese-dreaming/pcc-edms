<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The student/employee distinction is a profile attribute of the applicant, not a permission set —
// a student researcher and an employee researcher share the exact same `researcher_internal`
// capabilities (docs/0.2). Capturing it on the account (once, at creation) lets the DPREQ/REMIS
// intake form derive it instead of asking "Are you filling as…?" every time. Nullable: staff/admin
// and pre-existing accounts have no category; User::applicantCategory() defaults these to 'student'.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('applicant_category', ['student', 'employee'])->nullable()->after('department');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('applicant_category');
        });
    }
};
