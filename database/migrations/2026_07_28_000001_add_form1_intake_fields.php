<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Stakeholder changes (2026-07-28):
//  - The fixed-option dropdowns become open lists with an "Others (specify)" choice, so their
//    columns must hold arbitrary free text — the enums are relaxed to plain strings.
//  - The unified Form 1 intake now serves employees too, so it captures applicant_category
//    (student|employee) and an employee position.
//  - The Form 1 review checklist (voluntary participation, confidentiality, etc.) is now answered
//    on the intake and stored as JSON instead of printing blank.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('research_applications', function (Blueprint $table) {
            // Relax the closed enums to open strings so an "Others (specify)" value can be stored.
            $table->string('research_category')->nullable()->change();
            $table->string('data_collection_method')->change();
            $table->string('data_capturing_tool')->change();

            // Employee support on the shared intake.
            $table->string('applicant_category')->default('student')->after('adviser_name');
            $table->string('position')->nullable()->after('section');

            // Form 1 review checklist answers (items 3–7): { key => yes|no|not_applicable }.
            $table->json('review_checklist')->nullable()->after('respondent_head_letter_approved');
        });

        Schema::table('remis_applications', function (Blueprint $table) {
            $table->string('study_type')->change();
            $table->string('study_design')->change();
        });
    }

    public function down(): void
    {
        Schema::table('research_applications', function (Blueprint $table) {
            $table->dropColumn(['applicant_category', 'position', 'review_checklist']);
            $table->enum('research_category', ['academic', 'institutional', 'sponsored', 'student_thesis', 'faculty'])->nullable()->change();
            $table->enum('data_collection_method', ['survey_form', 'interview', 'mixed', 'observation'])->change();
            $table->enum('data_capturing_tool', ['electronic_form', 'paper_based', 'voice_recording', 'video_recording'])->change();
        });

        Schema::table('remis_applications', function (Blueprint $table) {
            $table->enum('study_type', ['thesis_dissertation', 'faculty_research', 'institutional', 'sponsored'])->change();
            $table->enum('study_design', ['quantitative', 'qualitative', 'mixed_methods'])->change();
        });
    }
};
