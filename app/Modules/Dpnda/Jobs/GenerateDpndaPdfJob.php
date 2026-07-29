<?php

namespace App\Modules\Dpnda\Jobs;

use App\Modules\Dpnda\Models\DpndaRecord;
use App\Shared\Documents\Services\DocumentService;
use App\Shared\Documents\Services\PdfGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

// docs/system-design.md §5 — queued so PDF generation never blocks the coordinator's
// countersign request. Dispatched from DpndaWorkflowService::coordinatorCountersign().
class GenerateDpndaPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $dpndaRecordId, private readonly int $generatedByUserId)
    {
    }

    public function handle(PdfGenerationService $pdf, DocumentService $documents): void
    {
        $record = DpndaRecord::with('placement')->findOrFail($this->dpndaRecordId);

        $bytes = $pdf->generate('pdf.dpnda-form5', [
            'record' => $record,
            'placement' => $record->placement,
        ]);

        $year = $record->created_at->year;

        $documents->storeGenerated(
            documentable: $record,
            bytes: $bytes,
            extension: 'pdf',
            mimeType: 'application/pdf',
            documentType: 'SignedNda',
            modulePrefix: 'DPNDA',
            recordId: $record->tracking_number,
            repositoryPath: "DPO/DPNDA/{$year}/{$record->placement->department_assigned}/{$record->tracking_number}",
            generatedByUserId: $this->generatedByUserId,
            department: $record->placement->department_assigned,
        );
    }
}
