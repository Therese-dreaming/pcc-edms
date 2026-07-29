<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// stakeholder-additional-features.md (2026-07-25), "Versioned File Submission": "Older versions
// remain available until final clearance is issued. After clearance issuance, previous versions
// may be archived or deleted according to the retention policy."
//
// `archived_at` marks a superseded version as archived once its clearance has issued — it stays
// readable (and downloadable for audit) but is visually separated from the live submission, and it
// is what the retention sweep (edms:apply-retention) uses to decide what may eventually be purged.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('is_current_version');

            $table->index('archived_at');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['archived_at']);
            $table->dropColumn('archived_at');
        });
    }
};
