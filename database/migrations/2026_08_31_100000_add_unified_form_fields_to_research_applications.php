<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Unified Research Ethics and Data Privacy Clearance Application Form (reqs/ July-7-2026 PDF,
// resolution B1 2026-08-31) — the applicant-facing Parts II–V deltas that were still missing on
// the shared intake. Existing columns keep their jobs: research_category (Type of Research,
// relaxed 2026-07-28), data_collection_method, respondents, data_types, purpose, retention_plan.
// Part VIII/IX review-side fields (ORD review result, DPIA flag, Privacy Review Result) are NOT
// intake fields and stay out of this migration.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_applications', function (Blueprint $table) {
            // Part II — structured funding source picklist (free-text detail stays on the REMIS track).
            $table->string('funding_source_type')->nullable()->after('research_category');

            // Part III — Participant Information.
            $table->text('recruitment_method')->nullable()->after('respondents');
            $table->json('target_participants')->nullable()->after('recruitment_method');

            // Part IV — Research Ethics Compliance.
            $table->json('ethics_checklist')->nullable()->after('review_checklist');
            $table->string('risk_band')->nullable()->after('ethics_checklist');
            $table->text('risk_band_explanation')->nullable()->after('risk_band');

            // Part V — Data Privacy Compliance (the study's own data handling plan).
            $table->string('data_classification')->nullable()->after('risk_band_explanation');
            $table->string('data_storage_method')->nullable()->after('data_classification');
            $table->text('data_access_persons')->nullable()->after('data_storage_method');
            $table->string('data_retention_period')->nullable()->after('data_access_persons');
            $table->string('data_disposal_method')->nullable()->after('data_retention_period');
        });
    }

    public function down(): void
    {
        Schema::table('research_applications', function (Blueprint $table) {
            $table->dropColumn([
                'funding_source_type',
                'recruitment_method',
                'target_participants',
                'ethics_checklist',
                'risk_band',
                'risk_band_explanation',
                'data_classification',
                'data_storage_method',
                'data_access_persons',
                'data_retention_period',
                'data_disposal_method',
            ]);
        });
    }
};
