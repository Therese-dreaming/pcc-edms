<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/system-design.md §3.1 `users` extension. Breeze's default `name`/`email`/`password`
// columns are kept as-is (they already match full_name/email/password_hash semantically) —
// this migration adds the fields system-design.md calls for beyond Breeze's defaults.
// `sso_subject_id` is nullable from day one per architecture.md ADR-002, so SSO can be added
// later without a further schema migration; `password` stays required for now since
// standalone accounts are the only built login path today (ADR-002).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('id')->constrained('roles')->nullOnDelete();
            $table->string('department')->nullable()->after('email');
            $table->enum('account_status', ['pending_validation', 'active', 'suspended', 'deactivated'])
                ->default('pending_validation')->after('department');
            $table->string('sso_subject_id')->nullable()->unique()->after('account_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('role_id');
            $table->dropColumn(['department', 'account_status', 'sso_subject_id']);
        });
    }
};
