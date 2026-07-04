<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/system-design.md §3.3 `dpnda_records` — Form 5 (OJT/Trainee NDA, DPO-POL-002),
// docs/2.2-dpnda-workflow.md status lifecycle. Typed-name signatures per architecture.md ADR-005.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dpnda_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('placement_id')->constrained('placements')->cascadeOnDelete();
            $table->string('tracking_number')->unique();
            $table->enum('status', [
                'draft',
                'sent_for_signing',
                'trainee_signed',
                'declined',
                'coordinator_countersigned',
                'completed',
            ])->default('draft');
            $table->string('guardian_name')->nullable();
            $table->string('trainee_signature_id')->nullable();
            $table->timestamp('trainee_signed_at')->nullable();
            $table->string('coordinator_signature_id')->nullable();
            $table->timestamp('coordinator_signed_at')->nullable();
            $table->text('decline_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dpnda_records');
    }
};
