<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/3.3-remis-review-workflow.md FRS §X — Ethics Committee Chair's final decision.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('remis_application_id')->constrained('remis_applications')->cascadeOnDelete();
            $table->enum('outcome', ['approved', 'approved_with_conditions', 'deferred', 'disapproved']);
            $table->foreignId('decided_by')->constrained('users');
            $table->date('decision_date');
            $table->text('conditions')->nullable();
            $table->text('remarks')->nullable();
            $table->string('signature_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('decisions');
    }
};
