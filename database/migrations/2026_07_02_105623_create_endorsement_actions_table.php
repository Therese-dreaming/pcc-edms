<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/3.3-remis-review-workflow.md FRS §IV — the academic endorsement chain
// (Adviser -> Program Head -> Dean). One row per step per attempt.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('endorsement_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('remis_application_id')->constrained('remis_applications')->cascadeOnDelete();
            $table->enum('step', ['adviser', 'program_head', 'dean']);
            $table->foreignId('endorser_id')->constrained('users');
            $table->enum('action', ['approve', 'return', 'reject']);
            $table->text('remarks')->nullable();
            $table->string('signature_id')->nullable();
            $table->timestamp('acted_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('endorsement_actions');
    }
};
