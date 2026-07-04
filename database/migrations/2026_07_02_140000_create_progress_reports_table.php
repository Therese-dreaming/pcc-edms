<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/3.4-remis-monitoring-archiving.md FRS §XII — periodic Research Progress Report,
// submitted by the researcher while a study is in the `monitoring` status (docs/3.3).
// `compliance_status` is filled in later by the Ethics Reviewer (docs/3.4's "Derived Fields"),
// hence nullable/reviewed_* columns.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('progress_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('remis_application_id')->constrained('remis_applications')->cascadeOnDelete();
            $table->foreignId('submitted_by')->constrained('users');
            $table->string('status_of_study');
            $table->unsignedInteger('participants_recruited');
            $table->text('ethics_concerns')->nullable();
            $table->text('protocol_deviations')->nullable();
            $table->text('corrective_actions')->nullable();
            $table->timestamp('submitted_at');
            $table->enum('compliance_status', ['compliant', 'minor_issues', 'major_issues', 'non_compliant'])->nullable();
            $table->text('review_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('progress_reports');
    }
};
