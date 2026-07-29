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

// stakeholder-additional-features.md (2026-07-25) — renders the standalone DPO (Data Privacy)
// clearance certificate, issued independently of the Ethics track. Dispatched from
// App\Shared\Clearance\Services\ClearanceService::signDpoTrack() the moment DPO approves. Queued
// so Browsershot's Chrome cold-start never blocks the approval request.
class GenerateDpreqClearancePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $certificateId)
    {
    }

    public function handle(PdfGenerationService $pdf, DocumentService $documents): void
    {
        $certificate = ClearanceCertificate::with(['researchApplication.applicant', 'dpoSignedBy'])
            ->findOrFail($this->certificateId);

        $bytes = $pdf->generate('pdf.dpreq-clearance', [
            'researchApplication' => $certificate->researchApplication,
            'certificate' => $certificate,
        ]);

        $year = $certificate->researchApplication->created_at->year;
        $controlNumber = $certificate->dpreq_certificate_number;

        $document = $documents->storeGenerated(
            documentable: $certificate,
            bytes: $bytes,
            extension: 'pdf',
            mimeType: 'application/pdf',
            documentType: 'DpreqClearanceCertificate',
            modulePrefix: 'DPREQ',
            recordId: $controlNumber,
            repositoryPath: "DPO/DPREQ/{$year}/{$controlNumber}",
            generatedByUserId: $certificate->dpo_signed_by,
            department: $certificate->researchApplication->department,
        );

        $certificate->update(['dpreq_pdf_document_id' => $document->id]);
    }
}
