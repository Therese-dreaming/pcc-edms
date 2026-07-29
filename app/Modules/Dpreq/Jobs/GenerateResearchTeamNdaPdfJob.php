<?php

namespace App\Modules\Dpreq\Jobs;

use App\Modules\Dpreq\Models\ResearchTeamNda;
use App\Shared\Documents\Services\DocumentService;
use App\Shared\Documents\Services\PdfGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

// docs/system-design.md §5 "Queue / event design" — PDF generation is queued so a ~1.5-2s
// Chrome cold-start (see PdfGenerationService) never blocks the HTTP response that completes
// the NDA signing. Dispatched from ResearchTeamNdaService once the NDA reaches `completed`.
class GenerateResearchTeamNdaPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $researchTeamNdaId, private readonly int $generatedByUserId)
    {
    }

    public function handle(PdfGenerationService $pdf, DocumentService $documents): void
    {
        $nda = ResearchTeamNda::with(['signatories', 'researchApplication.applicant'])->findOrFail($this->researchTeamNdaId);

        $bytes = $pdf->generate('pdf.research-team-nda', [
            'nda' => $nda,
            'researchApplication' => $nda->researchApplication,
        ]);

        $year = $nda->researchApplication->created_at->year;

        $documents->storeGenerated(
            documentable: $nda,
            bytes: $bytes,
            extension: 'pdf',
            mimeType: 'application/pdf',
            documentType: 'SignedResearchTeamNda',
            modulePrefix: 'DPREQ',
            recordId: $nda->tracking_number,
            repositoryPath: "DPO/DPREQ/{$year}/{$nda->tracking_number}",
            generatedByUserId: $this->generatedByUserId,
            department: $nda->researchApplication->department,
        );
    }
}
