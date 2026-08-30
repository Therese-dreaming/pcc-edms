<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// 2026-08-31 audit — some legitimate transitions happen with no authenticated session: a member
// finishing the Research Team NDA via their emailed signing link (/nda/sign/{token}) and the
// clearance issuance that completion triggers. status_history.changed_by was NOT NULL, so those
// paths crashed on insert. The actor is still attributed as precisely as possible (the signing
// user when known, the approving signer for clearance transitions) and captured fully in the
// audit trail + signatory identity columns either way.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('status_history', function (Blueprint $table) {
            $table->foreignId('changed_by')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('status_history', function (Blueprint $table) {
            $table->foreignId('changed_by')->nullable(false)->change();
        });
    }
};
