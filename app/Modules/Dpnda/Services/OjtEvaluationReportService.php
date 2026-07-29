<?php

namespace App\Modules\Dpnda\Services;

use App\Modules\Dpnda\Models\OjtEvaluationReport;
use App\Modules\Dpnda\Models\Placement;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\Documents\Services\DocumentService;
use Illuminate\Http\UploadedFile;
use RuntimeException;

// docs/2.1-dpnda-nda-template.md / docs/5.3 "Gap flagged" — Dept Coordinator uploads an
// evaluation report at placement end. One per placement (migration enforces uniqueness).
class OjtEvaluationReportService
{
    public function __construct(
        private readonly AuditLogService $auditLog,
        private readonly DocumentService $documents,
    ) {
    }

    public function upload(Placement $placement, UploadedFile $file, ?string $notes, int $coordinatorId): OjtEvaluationReport
    {
        if ($placement->ojtEvaluationReport !== null) {
            throw new RuntimeException('An evaluation report has already been uploaded for this placement.');
        }

        $report = OjtEvaluationReport::create([
            'placement_id' => $placement->id,
            'uploaded_by' => $coordinatorId,
            'submitted_at' => now(),
            'notes' => $notes,
        ]);

        $year = $placement->start_date->year;
        $recordId = $placement->dpndaRecord?->tracking_number ?? "PLACEMENT-{$placement->id}";

        $this->documents->store(
            $report,
            $file,
            'OjtEvaluationReport',
            'DPNDA',
            $recordId,
            "DPO/DPNDA/{$year}/{$placement->department_assigned}/{$recordId}",
            $placement->department_assigned,
        );

        $this->auditLog->record('ojt_evaluation_report.uploaded', $report, null, $report->toArray());

        return $report;
    }
}
