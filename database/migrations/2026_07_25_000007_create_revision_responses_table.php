<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// FRS §IX Researcher Response Matrix — the applicant's reply to a revision request: free-text
// response and/or the revised document (its version comes free from documents.version). A request
// may accumulate several responses across a back-and-forth.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('revision_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('revision_request_id')->constrained('revision_requests')->cascadeOnDelete();
            $table->text('response')->nullable();
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->foreignId('responded_by')->constrained('users');
            $table->timestamp('responded_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revision_responses');
    }
};
