<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/architecture.md ADR-005 (Proposed, never implemented until now) — the hybrid e-signature
// approach's drawn-signature half. The typed name + timestamp columns already on each of these
// tables (`signature_id` / `trainee_signature_id` / `coordinator_signature_id`) remain the
// legally-operative record per RA 8792; these new columns are the cosmetic canvas capture
// rendered onto the PDF alongside that typed name. Stored as a base64 PNG data URI directly on
// the row (LONGTEXT) rather than through the polymorphic `documents` table — a signature image
// is small, immutable once signed, and always rendered inline into a PDF, not
// downloaded/versioned like the documents this system's other file uploads are, so the
// heavier Document/DocumentService machinery doesn't fit here.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_team_nda_signatories', function (Blueprint $table) {
            $table->longText('signature_image')->nullable()->after('signature_id');
        });

        Schema::table('dpnda_records', function (Blueprint $table) {
            $table->longText('trainee_signature_image')->nullable()->after('trainee_signature_id');
            $table->longText('coordinator_signature_image')->nullable()->after('coordinator_signature_id');
        });

        Schema::table('endorsement_actions', function (Blueprint $table) {
            $table->longText('signature_image')->nullable()->after('signature_id');
        });

        Schema::table('decisions', function (Blueprint $table) {
            $table->longText('signature_image')->nullable()->after('signature_id');
        });
    }

    public function down(): void
    {
        Schema::table('research_team_nda_signatories', function (Blueprint $table) {
            $table->dropColumn('signature_image');
        });

        Schema::table('dpnda_records', function (Blueprint $table) {
            $table->dropColumn(['trainee_signature_image', 'coordinator_signature_image']);
        });

        Schema::table('endorsement_actions', function (Blueprint $table) {
            $table->dropColumn('signature_image');
        });

        Schema::table('decisions', function (Blueprint $table) {
            $table->dropColumn('signature_image');
        });
    }
};
