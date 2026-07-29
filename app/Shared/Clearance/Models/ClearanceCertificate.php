<?php

namespace App\Shared\Clearance\Models;

use App\Models\User;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// docs/0.4-dpo-ethics-integration.md — one row per research_application, but each track issues
// INDEPENDENTLY (stakeholder-additional-features.md, 2026-07-25). The DPO side is released the
// moment dpo_signed_by + dpreq_issued_at are set; the Ethics side the moment ethics_signed_by +
// remis_issued_at are set. Neither depends on the other. Issuance is performed by
// App\Shared\Clearance\Services\ClearanceService, not by controllers, so the rules stay in one
// place.
class ClearanceCertificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_application_id',
        'dpreq_certificate_number',
        'remis_certificate_number',
        'dpo_signed_by',
        'dpo_signed_at',
        'ethics_signed_by',
        'ethics_signed_at',
        'dpreq_issued_at',
        'dpreq_valid_until',
        'dpreq_qr_token',
        'dpreq_pdf_document_id',
        'remis_issued_at',
        'remis_valid_until',
        'remis_qr_token',
        'remis_pdf_document_id',
        'remis_certificate_kind',
    ];

    public function isRemisExemption(): bool
    {
        return $this->remis_certificate_kind === 'exemption';
    }

    protected function casts(): array
    {
        return [
            'dpo_signed_at' => 'datetime',
            'ethics_signed_at' => 'datetime',
            'dpreq_issued_at' => 'datetime',
            'dpreq_valid_until' => 'date',
            'remis_issued_at' => 'datetime',
            'remis_valid_until' => 'date',
        ];
    }

    public function researchApplication(): BelongsTo
    {
        return $this->belongsTo(ResearchApplication::class);
    }

    public function dpoSignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dpo_signed_by');
    }

    public function ethicsSignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ethics_signed_by');
    }

    public function dpreqPdfDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'dpreq_pdf_document_id');
    }

    public function remisPdfDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'remis_pdf_document_id');
    }

    public function isDpreqIssued(): bool
    {
        return $this->dpreq_issued_at !== null;
    }

    public function isRemisIssued(): bool
    {
        return $this->remis_issued_at !== null;
    }
}
