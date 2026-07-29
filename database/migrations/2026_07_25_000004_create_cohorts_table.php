<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A cohort is a class/section an adviser onboards in one go. It exists so an adviser does not have
// to hand-type 40-50 students into the single-applicant form: they create the cohort once, share
// its join code (link/QR), and students enroll themselves with details they already know.
//
// This is NOT a return to open self-registration (removed 2026-07-25) — enrollment is gated by an
// adviser-issued code that expires, can be capped, can be restricted to institutional email
// domains, and can be closed or regenerated at will. See docs/4.1 and CohortService.
//
// department/level/course/section deliberately mirror `research_applications` so a later change can
// prefill Form 1 from the joiner's cohort.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cohorts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('adviser_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');

            $table->string('department')->nullable();
            $table->string('level')->nullable();
            $table->string('course')->nullable();
            $table->string('section')->nullable();

            // The applicant role every joiner receives — constrained to researcher roles by
            // CohortPolicy/controller validation, not by the schema.
            $table->foreignId('role_id')->constrained('roles');

            // Short, human-typeable and projectable (see CohortService::generateJoinCode()).
            $table->string('join_code', 16)->unique();

            $table->timestamp('expires_at')->nullable();
            $table->unsignedInteger('max_members')->nullable();

            // null/empty = any domain (external researchers exist, so this can't be a global rule).
            $table->json('allowed_email_domains')->nullable();

            $table->boolean('is_open')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cohorts');
    }
};
