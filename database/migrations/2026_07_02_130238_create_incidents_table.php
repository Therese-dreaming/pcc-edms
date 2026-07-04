<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/3.5-remis-incident-reporting.md FRS §XIII — incident reporting, independent of the
// study's normal status lifecycle. investigation_notes is a simple append-only text field for
// this pass (a dedicated timestamped notes log is a follow-up, not built here).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('remis_application_id')->constrained('remis_applications')->cascadeOnDelete();
            $table->enum('incident_type', [
                'participant_complaint',
                'data_breach',
                'confidentiality_breach',
                'psychological_harm',
                'protocol_violation',
                'other',
            ]);
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->date('incident_date');
            $table->foreignId('reported_by')->constrained('users');
            $table->text('description');
            $table->text('immediate_actions')->nullable();
            $table->enum('status', [
                'reported',
                'under_investigation',
                'corrective_action_in_progress',
                'resolved',
                'closed',
            ])->default('reported');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->text('investigation_notes')->nullable();
            $table->text('corrective_action_required')->nullable();
            $table->date('corrective_action_due_date')->nullable();
            $table->enum('corrective_action_status', ['not_started', 'in_progress', 'completed', 'verified'])
                ->default('not_started');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
