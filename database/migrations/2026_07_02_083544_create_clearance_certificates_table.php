<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/0.4-dpo-ethics-integration.md + docs/system-design.md §3.1 `clearance_certificates` —
// one joint certificate per research_application (Form 3), gated on BOTH dpo_signed_by and
// ethics_signed_by being set before issued_at/qr_token/pdf are populated. Enforced in
// App\Shared\Clearance\Services\ClearanceService, not just at the schema level.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clearance_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_application_id')->constrained('research_applications')->cascadeOnDelete();
            $table->string('dpreq_certificate_number')->nullable()->unique();
            $table->string('remis_certificate_number')->nullable()->unique();
            $table->foreignId('dpo_signed_by')->nullable()->constrained('users');
            $table->timestamp('dpo_signed_at')->nullable();
            $table->foreignId('ethics_signed_by')->nullable()->constrained('users');
            $table->timestamp('ethics_signed_at')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->date('valid_until')->nullable();
            $table->foreignId('pdf_document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->string('qr_token')->nullable()->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clearance_certificates');
    }
};
