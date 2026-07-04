<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/system-design.md §3.4 `remis_applications` — the Ethics track, 1:1 with a
// research_applications row (docs/0.4-dpo-ethics-integration.md). research_title,
// target_start_date/target_end_date live on the shared parent, not duplicated here.
// current_endorsement_step tracks whose turn it is within the single "Under Endorsement"
// status (FRS §IV — the three steps don't each get their own top-level status).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('remis_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_application_id')->constrained('research_applications')->cascadeOnDelete();
            $table->string('tracking_number')->unique();
            $table->foreignId('applicant_id')->constrained('users');
            $table->foreignId('adviser_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('study_type', ['thesis_dissertation', 'faculty_research', 'institutional', 'sponsored']);
            $table->enum('study_design', ['quantitative', 'qualitative', 'mixed_methods']);
            $table->text('target_population');
            $table->unsignedInteger('participant_count');
            $table->text('inclusion_criteria');
            $table->text('exclusion_criteria');
            $table->boolean('vulnerable_population')->default(false);
            $table->string('study_sites');
            $table->string('funding_source')->nullable();
            $table->text('risks_to_participants');
            $table->text('benefits');
            $table->text('confidentiality_measures');
            $table->text('consent_process');
            $table->text('data_storage_plan');
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
                'closed',
                'archived',
            ])->default('draft_submitted');
            $table->enum('current_endorsement_step', ['adviser', 'program_head', 'dean'])->nullable();
            $table->enum('returned_from_status', [
                'under_endorsement', 'for_screening', 'for_review',
            ])->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('remis_applications');
    }
};
