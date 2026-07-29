<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Stakeholder 2026-07-28 — Form 1 must carry the researcher's signature. Captured at submission as a
// drawn PNG (data URI), rendered into the generated Form 1. The adviser still signs the printed copy.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_applications', function (Blueprint $table) {
            $table->longText('researcher_signature')->nullable()->after('review_checklist');
        });
    }

    public function down(): void
    {
        Schema::table('research_applications', function (Blueprint $table) {
            $table->dropColumn('researcher_signature');
        });
    }
};
