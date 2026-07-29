<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// stakeholder-additional-features.md (2026-07-25), "Individual Member Electronic Signature
// Workflow" — instead of one shared signing page, each research member gets a UNIQUE signing
// link delivered by email. Each link: is unique, tied to one member, expires after a configurable
// period, and is usable only once. These columns support that on the existing per-member
// signatory row (the leader row created at submission has no email/token — the leader signs while
// logged in; co-members added later are invited by email).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_team_nda_signatories', function (Blueprint $table) {
            $table->string('email')->nullable()->after('full_name');
            $table->string('signing_token', 64)->nullable()->unique()->after('signature_user_agent');
            $table->timestamp('token_expires_at')->nullable()->after('signing_token');
            $table->timestamp('invited_at')->nullable()->after('token_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('research_team_nda_signatories', function (Blueprint $table) {
            $table->dropColumn(['email', 'signing_token', 'token_expires_at', 'invited_at']);
        });
    }
};
