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
            // Collapsed to Review -> Approve (2026-07-25): 'screening' and 'endorsed' retired.
            $table->enum('status', [
                'draft',
                'submitted',
                'returned',
                'under_review',
                'rejected',
                'approved',
                'clearance_issued',
            ])->default('draft');
            $table->foreignId('current_reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            // The DPO who approved. Recorded on approval so the DPO (DPREQ) clearance — now issued
            // later, when the Research Team NDA is fully signed (concern 7) — is attributed to them.
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            // Register housekeeping: `archived_at` removes a record from the active register while
            // keeping it (and its audit trail) intact; soft-delete removes it from view entirely
            // but is recoverable. Both drive the DPREQ index bulk Actions menu.
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dpreq_applications');
    }
};
