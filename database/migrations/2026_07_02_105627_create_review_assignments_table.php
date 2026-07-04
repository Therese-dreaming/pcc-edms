<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/3.3-remis-review-workflow.md FRS §VIII — Ethics Reviewer assignment + recommendation.
// Simplified to a single assigned reviewer per application for this pass (FRS allows multiple
// for Committee/Full Board tracks; multi-reviewer consolidation is a follow-up, not built here).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('remis_application_id')->constrained('remis_applications')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users');
            $table->timestamp('assigned_at');
            $table->enum('recommendation', ['approve', 'minor_revision', 'major_revision', 'disapprove'])->nullable();
            $table->text('comments')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_assignments');
    }
};
