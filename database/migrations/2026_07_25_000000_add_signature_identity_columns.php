<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// stakeholder-additional-features.md (2026-07-25), "Enhanced Electronic Signature Identification"
// — every e-signature records who/when plus the signer's IP address and device (user agent), for
// stronger legal evidence and a better audit trail. The name + timestamp already exist on each
// table; these add the IP + device. All nullable: old pre-migration signatures have none, and
// signatures captured outside an HTTP request (e.g. seeders) may not either.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_team_nda_signatories', function (Blueprint $table) {
            $table->string('signature_ip', 45)->nullable()->after('signature_image');
            $table->text('signature_user_agent')->nullable()->after('signature_ip');
        });

        Schema::table('dpnda_records', function (Blueprint $table) {
            $table->string('trainee_signature_ip', 45)->nullable()->after('trainee_signature_image');
            $table->text('trainee_signature_user_agent')->nullable()->after('trainee_signature_ip');
            $table->string('coordinator_signature_ip', 45)->nullable()->after('coordinator_signature_image');
            $table->text('coordinator_signature_user_agent')->nullable()->after('coordinator_signature_ip');
        });

        Schema::table('endorsement_actions', function (Blueprint $table) {
            $table->string('signature_ip', 45)->nullable()->after('signature_image');
            $table->text('signature_user_agent')->nullable()->after('signature_ip');
        });

        Schema::table('decisions', function (Blueprint $table) {
            $table->string('signature_ip', 45)->nullable()->after('signature_image');
            $table->text('signature_user_agent')->nullable()->after('signature_ip');
        });
    }

    public function down(): void
    {
        Schema::table('research_team_nda_signatories', function (Blueprint $table) {
            $table->dropColumn(['signature_ip', 'signature_user_agent']);
        });

        Schema::table('dpnda_records', function (Blueprint $table) {
            $table->dropColumn([
                'trainee_signature_ip', 'trainee_signature_user_agent',
                'coordinator_signature_ip', 'coordinator_signature_user_agent',
            ]);
        });

        Schema::table('endorsement_actions', function (Blueprint $table) {
            $table->dropColumn(['signature_ip', 'signature_user_agent']);
        });

        Schema::table('decisions', function (Blueprint $table) {
            $table->dropColumn(['signature_ip', 'signature_user_agent']);
        });
    }
};
