<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Optimistic-locking counter for the two workflow records multiple staff can act on concurrently
// (App\Shared\Concurrency\Concerns\OptimisticLocking). Replaces the inert `$optimisticLock =
// 'updated_at'` properties from Phase 8, which relied on a framework feature that does not exist
// — see docs/CHANGELOG.md (2026-07-25). A counter is used rather than `updated_at` because the
// latter has one-second precision and would miss same-second conflicts.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('remis_applications', function (Blueprint $table) {
            $table->unsignedBigInteger('version')->default(1)->after('status');
        });

        Schema::table('dpreq_applications', function (Blueprint $table) {
            $table->unsignedBigInteger('version')->default(1)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('remis_applications', function (Blueprint $table) {
            $table->dropColumn('version');
        });

        Schema::table('dpreq_applications', function (Blueprint $table) {
            $table->dropColumn('version');
        });
    }
};
