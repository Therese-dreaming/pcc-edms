<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// FRS §VI Administrative Screening — the Ethics Secretariat's completeness checklist for an
// application, recorded per screening. On an "incomplete" / "returned for compliance" outcome the
// system auto-generates a deficiency notice (see GenerateDeficiencyNoticeJob).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screening_checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('remis_application_id')->constrained('remis_applications')->cascadeOnDelete();
            // The five FRS §VI checkboxes.
            $table->boolean('proposal_attached')->default(false);
            $table->boolean('consent_form_attached')->default(false);
            $table->boolean('instrument_attached')->default(false);
            $table->boolean('signatures_complete')->default(false);
            $table->boolean('required_templates_used')->default(false);
            $table->enum('decision', ['complete', 'incomplete', 'returned_for_compliance']);
            $table->text('comments')->nullable();
            $table->foreignId('screened_by')->constrained('users');
            $table->timestamp('screened_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screening_checklists');
    }
};
