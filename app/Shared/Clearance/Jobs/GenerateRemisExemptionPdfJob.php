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

// Stakeholder 2026-07-28 — renders the Research Ethics Committee's Certificate of Exemption,
// issued when the ethics decision is "exempted" instead of a full clearance. Dispatched from
// App\Shared\Clearance\Services\ClearanceService::signEthicsTrack(). Queued so Browsershot's
// Chrome cold-start never blocks the decision request.
class GenerateRemisExemptionPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $certificateId)
    {
    }

    public function handle(PdfGenerationService $pdf, DocumentService $documents): void
    {
        $certificate = ClearanceCertificate::with(['researchApplication.applicant', 'ethicsSignedBy'])
            ->findOrFail($this->certificateId);

        $bytes = $pdf->generate('pdf.remis-exemption', [
            'researchApplication' => $certificate->researchApplication,
            'certificate' => $certificate,
        ]);

        $year = $certificate->researchApplication->created_at->year;
        $controlNumber = $certificate->remis_certificate_number;

        $document = $documents->storeGenerated(
            documentable: $certificate,
            bytes: $bytes,
            extension: 'pdf',
            mimeType: 'application/pdf',
            documentType: 'RemisExemptionCertificate',
            modulePrefix: 'REMIS',
            recordId: $controlNumber,
            repositoryPath: "ORD/REMIS/{$year}/{$controlNumber}",
            generatedByUserId: $certificate->ethics_signed_by,
            department: $certificate->researchApplication->department,
        );

        $certificate->update(['remis_pdf_document_id' => $document->id]);
    }
}
