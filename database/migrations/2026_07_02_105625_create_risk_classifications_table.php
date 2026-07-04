<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/3.2-remis-screening-risk.md FRS §VII — risk classification, drives the review track.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_classifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('remis_application_id')->constrained('remis_applications')->cascadeOnDelete();
            $table->enum('level', ['minimal', 'moderate', 'high']);
            $table->enum('review_type', ['expedited', 'committee', 'full_board']);
            $table->foreignId('classified_by')->constrained('users');
            $table->date('classification_date');
            $table->text('rationale');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_classifications');
    }
};
