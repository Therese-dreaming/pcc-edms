<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/2.1-dpnda-nda-template.md §2.1.a — one row per research team member (Leader/Member),
// per-member signature capture for the Form 2 NDA. user_id nullable: external team members may
// not have PCC-EDMS accounts (docs/0.2's Researcher (External) role).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_team_nda_signatories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_team_nda_id')->constrained('research_team_ndas')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('full_name');
            $table->enum('role', ['leader', 'member']);
            $table->string('signature_id')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_team_nda_signatories');
    }
};
