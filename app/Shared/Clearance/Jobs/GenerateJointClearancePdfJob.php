<?php

namespace App\Shared\Clearance\Jobs;

use App\Shared\Clearance\Models\ClearanceCertificate;
use App\Shared\Documents\Services\DocumentService;
use App\Shared\Documents\Services\PdfGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

// docs/0.4-dpo-ethics-integration.md — renders Form 3 only once both signatures are present
// (dispatched from Shared\Clearance\Services\ClearanceService::maybeIssue(), never earlier).
// Queued for the same reason as the NDA PDF jobs: Browsershot's Chrome cold-start shouldn't
// block whichever track's signing request happened to complete the pair.
class GenerateJointClearancePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $certificateId)
    {
    }

    public function handle(PdfGenerationService $pdf, DocumentService $documents): void
    {
        $certificate = ClearanceCertificate::with(['researchApplication.applicant', 'dpoSignedBy', 'ethicsSignedBy'])
            ->findOrFail($this->certificateId);

        $bytes = $pdf->generate('pdf.joint-clearance', [
            'researchApplication' => $certificate->researchApplication,
            'certificate' => $certificate,
        ]);

        $year = $certificate->researchApplication->created_at->year;

        $document = $documents->storeGenerated(
            documentable: $certificate,
            bytes: $bytes,
            extension: 'pdf',
            mimeType: 'application/pdf',
            documentType: 'JointClearanceCertificate',
            modulePrefix: 'DPREQ',
            recordId: $certificate->dpreq_certificate_number,
            repositoryPath: "DPO/DPREQ/{$year}/{$certificate->dpreq_certificate_number}",
            generatedByUserId: $certificate->dpo_signed_by,
        );

        $certificate->update(['pdf_document_id' => $document->id]);
    }
}
