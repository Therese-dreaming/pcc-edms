<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/0.4-dpo-ethics-integration.md + docs/system-design.md §3.1 `research_applications` —
// the single Form 1 intake shared by the DPO track (dpreq_applications) and the Ethics track
// (remis_applications), each holding a 1:1 research_application_id FK to this table.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->constrained('users');
            $table->string('research_title');
            $table->unsignedTinyInteger('researcher_count')->default(1);
            $table->string('adviser_name');
            $table->string('department')->nullable();
            $table->string('level')->nullable();
            $table->string('course')->nullable();
            $table->string('section')->nullable();
            $table->string('respondents');
            $table->unsignedInteger('target_respondent_count');
            $table->enum('data_collection_method', ['survey_form', 'interview', 'mixed', 'observation']);
            $table->enum('data_capturing_tool', ['electronic_form', 'paper_based', 'voice_recording', 'video_recording']);
            $table->date('target_start_date');
            $table->date('target_end_date');
            $table->boolean('minors_involved')->default(false);
            $table->boolean('respondent_head_letter_approved')->default(false);
            $table->enum('overall_status', ['in_progress', 'clearance_issued'])->default('in_progress');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_applications');
    }
};
