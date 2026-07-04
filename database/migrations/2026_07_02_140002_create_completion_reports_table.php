<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/3.4-remis-monitoring-archiving.md FRS §XIV — Final Ethics Completion Report, one per
// study (1:1 with remis_applications). Submitting it is the trigger that moves the study
// `monitoring` -> `closed` -> `archived` in one step (RemisMonitoringService::submitCompletionReport)
// — the FRS describes this as "on acceptance" but names no separate accept action/role, so
// submission itself is treated as acceptance (a simplification, flagged in the service docblock).
// `archived_at` lives here rather than on `remis_applications` because "Archived By" is
// "System (auto)" per the FRS, not a real user reference worth its own column.
// `final_outcome`'s `discontinued`/`withdrawn` values are schema-only for now — the FRS flags
// early-exit/discontinuation as an open question, so no workflow reaches those states yet.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('completion_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('remis_application_id')->unique()->constrained('remis_applications')->cascadeOnDelete();
            $table->date('completion_date');
            $table->unsignedInteger('final_participant_count');
            $table->text('compliance_statement');
            $table->string('publication_status');
            $table->string('data_storage_location');
            $table->enum('final_outcome', ['completed', 'discontinued', 'withdrawn'])->default('completed');
            $table->foreignId('submitted_by')->constrained('users');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('completion_reports');
    }
};
