<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/2.1-dpnda-nda-template.md §2.1.a (Form 2, DPO-POL-005) + docs/system-design.md §3.1
// `research_team_ndas` — must reach `completed` (all research_team_nda_signatories signed)
// before the DPO track (docs/1.2) can reach Approved.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_team_ndas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_application_id')->constrained('research_applications')->cascadeOnDelete();
            $table->string('tracking_number')->unique();
            $table->enum('status', ['draft', 'pending_signatures', 'completed'])->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_team_ndas');
    }
};
