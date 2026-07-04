<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/5.3-reports-dpo.md "Gap flagged" — this table was design-only (never migrated) until the
// "Offices/departments that have uploaded OJT evaluation reports" report needed a real data
// source. docs/2.1 recommended it as an explicit deliverable: Dept Coordinator uploads an
// evaluation report at placement end. 1:1 with `placements` — one evaluation report per
// placement, matching the DPO reports.md wording ("uploaded" vs "not uploaded" per placement).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ojt_evaluation_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('placement_id')->unique()->constrained('placements')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamp('submitted_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ojt_evaluation_reports');
    }
};
