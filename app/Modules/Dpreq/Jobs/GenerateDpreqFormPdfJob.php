<?php

namespace App\Modules\Dpreq\Jobs;

use App\Modules\Dpreq\Models\DpreqApplication;
use App\Shared\Documents\Services\DocumentService;
use App\Shared\Documents\Services\PdfGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

// docs/1.1-dpreq-application-form.md "Output" — Form 1 is rendered to PDF on submission so the
// applicant/DPO always has a paper-faithful copy of exactly what was submitted (distinct from
// Form 3, the joint clearance issued only after both tracks approve). Queued for the same reason
// as GenerateResearchTeamNdaPdfJob: a ~1.5-2s Chrome cold-start must never block the submit
// response.
class GenerateDpreqFormPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $dpreqApplicationId, private readonly int $generatedByUserId)
    {
    }

    public function handle(PdfGenerationService $pdf, DocumentService $documents): void
    {
        $application = DpreqApplication::with(['applicant', 'researchApplication'])->findOrFail($this->dpreqApplicationId);

        $bytes = $pdf->generate('pdf.dpreq-form1', [
            'application' => $application,
            'researchApplication' => $application->researchApplication,
        ]);

        $year = $application->created_at->year;

        $documents->storeGenerated(
            documentable: $application,
            bytes: $bytes,
            extension: 'pdf',
            mimeType: 'application/pdf',
            documentType: 'Form1Application',
            modulePrefix: 'DPREQ',
            recordId: $application->tracking_number,
            repositoryPath: "DPO/DPREQ/{$year}/{$application->tracking_number}",
            generatedByUserId: $this->generatedByUserId,
            department: $application->department,
        );
    }
}
