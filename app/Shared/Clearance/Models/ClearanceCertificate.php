<?php

namespace App\Shared\Clearance\Models;

use App\Models\User;
use App\Shared\Documents\Models\Document;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// docs/0.4-dpo-ethics-integration.md — one joint certificate per research_application (Form 3).
// Release rule: not applicant-visible/downloadable until BOTH dpo_signed_by and
// ethics_signed_by are set. Enforced via isIssuable()/issue() here, called from
// App\Shared\Clearance\Services\ClearanceService rather than left to controllers to get right.
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
        'issued_at',
        'valid_until',
        'pdf_document_id',
        'qr_token',
    ];

    protected function casts(): array
    {
        return [
            'dpo_signed_at' => 'datetime',
            'ethics_signed_at' => 'datetime',
            'issued_at' => 'datetime',
            'valid_until' => 'date',
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

    public function pdfDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'pdf_document_id');
    }

    public function isFullySigned(): bool
    {
        return $this->dpo_signed_by !== null && $this->ethics_signed_by !== null;
    }

    public function isIssued(): bool
    {
        return $this->issued_at !== null;
    }
}
