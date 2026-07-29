<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/0.4-dpo-ethics-integration.md + docs/system-design.md §3.1 `clearance_certificates` —
// one row per research_application, but each track issues its OWN certificate INDEPENDENTLY
// (stakeholder-additional-features.md, "Independent Certificate Issuance", 2026-07-25): DPO
// approval issues the DPREQ certificate immediately; the Ethics decision issues the REMIS
// certificate immediately. Neither waits for the other — there is no longer a joint dual-signed
// release gate. Each track carries its own control number, issue date, validity, QR token and
// PDF. Issuance is driven from App\Shared\Clearance\Services\ClearanceService, not the schema.
//
// `dpreq_certificate_number` / `remis_certificate_number` hold the per-track CONTROL NUMBER
// (e.g. DPREQ-2026-000145 / REMIS-2026-000098) — auto-generated, never reused, searchable, and
// printed on the certificate. This is distinct from the application's tracking_number (which
// stays on dpreq_applications/remis_applications as the internal working ID).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clearance_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_application_id')->constrained('research_applications')->cascadeOnDelete();

            // Per-track control numbers (authenticity IDs printed on each certificate).
            $table->string('dpreq_certificate_number')->nullable()->unique();
            $table->string('remis_certificate_number')->nullable()->unique();

            // Signers (the certificate records who signed each side).
            $table->foreignId('dpo_signed_by')->nullable()->constrained('users');
            $table->timestamp('dpo_signed_at')->nullable();
            $table->foreignId('ethics_signed_by')->nullable()->constrained('users');
            $table->timestamp('ethics_signed_at')->nullable();

            // DPO track — independent issuance.
            $table->timestamp('dpreq_issued_at')->nullable();
            $table->date('dpreq_valid_until')->nullable();
            $table->string('dpreq_qr_token')->nullable()->unique();
            $table->foreignId('dpreq_pdf_document_id')->nullable()->constrained('documents')->nullOnDelete();

            // Ethics track — independent issuance.
            $table->timestamp('remis_issued_at')->nullable();
            $table->date('remis_valid_until')->nullable();
            $table->string('remis_qr_token')->nullable()->unique();
            $table->foreignId('remis_pdf_document_id')->nullable()->constrained('documents')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clearance_certificates');
    }
};
