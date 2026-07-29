<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Stakeholder 2026-07-28 — the Research Ethics Committee now issues its own certificates: a
// Clearance Certificate (approved) and a new Certificate of Exemption (exempted). "Exempted" is a
// new terminal ethics-decision outcome, and each issued certificate records which kind it is.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('remis_applications', function (Blueprint $table) {
            $table->enum('status', [
                'draft_submitted',
                'under_endorsement',
                'for_screening',
                'for_revision',
                'for_review',
                'approved',
                'approved_with_conditions',
                'exempted',
                'deferred',
                'disapproved',
                'clearance_issued',
                'monitoring',
                'monitoring_paused',
                'closed',
                'archived',
            ])->default('draft_submitted')->change();
        });

        Schema::table('clearance_certificates', function (Blueprint $table) {
            // 'clearance' or 'exemption' — which Ethics certificate was issued.
            $table->string('remis_certificate_kind')->nullable()->after('remis_pdf_document_id');
        });
    }

    public function down(): void
    {
        Schema::table('clearance_certificates', function (Blueprint $table) {
            $table->dropColumn('remis_certificate_kind');
        });

        Schema::table('remis_applications', function (Blueprint $table) {
            $table->enum('status', [
                'draft_submitted',
                'under_endorsement',
                'for_screening',
                'for_revision',
                'for_review',
                'approved',
                'approved_with_conditions',
                'deferred',
                'disapproved',
                'clearance_issued',
                'monitoring',
                'monitoring_paused',
                'closed',
                'archived',
            ])->default('draft_submitted')->change();
        });
    }
};
