<?php

namespace App\Modules\Remis\Jobs;

use App\Modules\Remis\Models\ScreeningChecklist;
use App\Shared\Documents\Services\DocumentService;
use App\Shared\Documents\Services\PdfGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

// FRS §VI — "The system must automatically generate a deficiency notice when an application is
// marked incomplete or returned for compliance." Renders it to PDF and stores it against the REMIS
// application (downloadable from its documents list). Queued like the other PDF jobs so Chrome's
// cold start never blocks the screening request.
class GenerateDeficiencyNoticeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $checklistId)
    {
    }

    public function handle(PdfGenerationService $pdf, DocumentService $documents): void
    {
        $checklist = ScreeningChecklist::with('remisApplication.researchApplication.applicant', 'screener')
            ->findOrFail($this->checklistId);

        $application = $checklist->remisApplication;

        $bytes = $pdf->generate('pdf.deficiency-notice', [
            'application' => $application,
            'checklist' => $checklist,
        ]);

        $year = $application->created_at->year;

        $documents->storeGenerated(
            documentable: $application,
            bytes: $bytes,
            extension: 'pdf',
            mimeType: 'application/pdf',
            documentType: 'DeficiencyNotice',
            modulePrefix: 'REMIS',
            recordId: $application->tracking_number,
            repositoryPath: "ORD/REMIS/{$year}/{$application->tracking_number}",
            generatedByUserId: $checklist->screened_by,
            department: $application->researchApplication->department,
        );
    }
}
