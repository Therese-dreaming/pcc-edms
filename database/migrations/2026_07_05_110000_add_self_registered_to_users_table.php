<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Distinguishes a self-service /register signup from an admin-created account (Admin/Users/Create
// or the bulk CSV import) — both leave role_id null until assigned, but only the self-registered
// path should be funneled into the self-service role picker (/select-role). An admin who
// deliberately leaves a new account role-less is choosing to assign it manually later, not
// opting into the researcher/OJT-only picker.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('self_registered')->default(false)->after('account_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('self_registered');
        });
    }
};
