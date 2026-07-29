<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// FRS §IX Revision Management — the "back-and-forth" mechanism where a reviewer/staff raises an item
// (a comment to address, or a document that must be supplied) and the applicant responds. Polymorphic
// so ONE implementation serves both REMIS (reviewer/secretariat comments) and DPO (the DPO staff
// requesting additional requirements, item 7). Reused verbatim — see app/Shared/Revisions.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('revision_requests', function (Blueprint $table) {
            $table->id();
            $table->morphs('requestable'); // RemisApplication or DpreqApplication
            $table->foreignId('raised_by')->constrained('users');
            $table->text('item'); // the comment, or a description of the document required
            $table->enum('kind', ['comment', 'document_required'])->default('comment');
            $table->boolean('is_mandatory')->default(true);
            $table->date('due_date')->nullable();
            $table->enum('status', ['open', 'responded', 'resolved', 'waived'])->default('open');
            $table->foreignId('resolved_by')->nullable()->constrained('users');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['requestable_type', 'requestable_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revision_requests');
    }
};
