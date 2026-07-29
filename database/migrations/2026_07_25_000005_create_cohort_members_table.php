<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The cohort roster. One table serves BOTH onboarding paths:
//   - self-enrolment via the join code  -> row created already `joined`, user_id set
//   - adviser manual-add fallback       -> row created `invited` with a token, becomes `joined`
//                                          when the student accepts the emailed link
//
// Same shape as `research_team_nda_signatories` (nullable user_id + single-use expiring token), so
// the invitation pattern stays consistent with the Form 2 signing flow.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cohort_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cohort_id')->constrained('cohorts')->cascadeOnDelete();
            // Null until the account exists (an invited member who hasn't accepted yet).
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('full_name');
            $table->string('email');
            $table->string('student_number')->nullable();

            // `pending` is unused today — reserved so an adviser-approves-each-joiner mode can be
            // added later without a schema change (see docs/CHANGELOG.md 2026-07-25).
            $table->enum('status', ['invited', 'pending', 'joined', 'removed'])->default('invited');

            $table->string('invitation_token', 64)->nullable()->unique();
            $table->timestamp('token_expires_at')->nullable();
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('joined_at')->nullable();

            $table->timestamps();

            // One row per email per cohort — blocks double-enrolment and duplicate invitations.
            $table->unique(['cohort_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cohort_members');
    }
};
