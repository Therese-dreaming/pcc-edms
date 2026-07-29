<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// FRS §VIII Review Criteria — a reviewer assesses each of the seven named ethics criteria per
// assignment. Keyed to review_assignments (the per-reviewer, per-application row), so the Chair's
// consolidation can surface exactly which criteria drew concerns and from whom.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_criteria_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_assignment_id')->constrained('review_assignments')->cascadeOnDelete();
            $table->enum('criterion', [
                'voluntary_participation',
                'informed_consent',
                'protection_from_harm',
                'confidentiality',
                'participant_selection',
                'privacy_protection',
                'ethical_acceptability',
            ]);
            $table->enum('verdict', ['met', 'concerns', 'not_met']);
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['review_assignment_id', 'criterion'], 'rca_assignment_criterion_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_criteria_assessments');
    }
};
