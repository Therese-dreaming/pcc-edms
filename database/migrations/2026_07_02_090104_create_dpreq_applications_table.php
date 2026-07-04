<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/system-design.md §3.2 `dpreq_applications` — the DPO track, 1:1 with a
// research_applications row (docs/0.4-dpo-ethics-integration.md). research_title,
// data_collection_method, target dates live on the parent research_applications row and are
// not duplicated here. Per-transition comments (Returned/Rejected reasons, docs/1.2) live on
// status_history, not as columns here.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dpreq_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_application_id')->constrained('research_applications')->cascadeOnDelete();
            $table->string('tracking_number')->unique();
            $table->foreignId('applicant_id')->constrained('users');
            $table->enum('applicant_type', ['internal_researcher', 'external_researcher', 'student']);
            $table->string('department')->nullable();
            $table->text('purpose');
            $table->json('data_types');
            $table->json('data_subjects');
            $table->text('retention_plan');
            $table->boolean('third_party_sharing')->default(false);
            $table->text('third_party_detail')->nullable();
            $table->enum('status', [
                'draft',
                'submitted',
                'screening',
                'returned',
                'under_review',
                'endorsed',
                'rejected',
                'approved',
                'clearance_issued',
            ])->default('draft');
            $table->foreignId('current_reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dpreq_applications');
    }
};
