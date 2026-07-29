<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Stakeholder 2026-07-28 — external advisers (a MAED adviser, a partner school's head/principal)
// have no way to obtain an account since self-registration was removed. They request one here; the
// DPO/admin reviews and, on approval, an `adviser` account is created for them so they can run their
// own cohort. Every external onboarder is simply an `adviser`, regardless of their real-world role.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adviser_account_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('institution')->nullable();
            $table->string('department')->nullable();
            $table->text('purpose');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            // The adviser account created on approval (kept for provenance).
            $table->foreignId('created_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adviser_account_requests');
    }
};
