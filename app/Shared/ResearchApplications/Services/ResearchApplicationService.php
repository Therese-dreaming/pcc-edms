<?php

namespace App\Shared\ResearchApplications\Services;

use App\Models\User;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Dpreq\Services\DpreqWorkflowService;
use App\Modules\Dpreq\Services\ResearchTeamNdaService;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Services\RemisWorkflowService;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Support\Facades\DB;

// docs/0.4-dpo-ethics-integration.md — one Form 1 submission creates the shared
// research_applications row plus both tracks: dpreq_applications (DPO) and remis_applications
// (Ethics). This closes the gap flagged during the DPREQ pass, when REMIS didn't exist yet.
class ResearchApplicationService
{
    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
        private readonly DpreqWorkflowService $dpreqWorkflow,
        private readonly ResearchTeamNdaService $researchTeamNda,
        private readonly RemisWorkflowService $remisWorkflow,
    ) {
    }

    public function submitForm1(array $validated, User $applicant): DpreqApplication
    {
        return DB::transaction(function () use ($validated, $applicant) {
            $researchApplication = ResearchApplication::create([
                'applicant_id' => $applicant->id,
                'research_title' => $validated['research_title'],
                'researcher_count' => $validated['researcher_count'],
                'adviser_name' => $validated['adviser_name'],
                'department' => $validated['department'] ?? null,
                'level' => $validated['level'] ?? null,
                'course' => $validated['course'] ?? null,
                'section' => $validated['section'] ?? null,
                'respondents' => $validated['respondents'],
                'target_respondent_count' => $validated['target_respondent_count'],
                'data_collection_method' => $validated['data_collection_method'],
                'data_capturing_tool' => $validated['data_capturing_tool'],
                'target_start_date' => $validated['target_start_date'],
                'target_end_date' => $validated['target_end_date'],
                'minors_involved' => $validated['minors_involved'] ?? false,
                'respondent_head_letter_approved' => $validated['respondent_head_letter_approved'] ?? false,
                'overall_status' => 'in_progress',
            ]);

            $dpreqApplication = DpreqApplication::create([
                'research_application_id' => $researchApplication->id,
                'tracking_number' => $this->nextDpreqTrackingNumber(),
                'applicant_id' => $applicant->id,
                'applicant_type' => $validated['applicant_type'],
                'department' => $validated['department'] ?? null,
                'purpose' => $validated['purpose'],
                'data_types' => $validated['data_types'],
                'data_subjects' => $validated['data_subjects'],
                'retention_plan' => $validated['retention_plan'],
                'third_party_sharing' => $validated['third_party_sharing'] ?? false,
                'third_party_detail' => $validated['third_party_detail'] ?? null,
                'status' => 'draft',
            ]);

            $this->statusHistory->record($dpreqApplication, null, 'draft');
            $this->auditLog->record('dpreq_application.created', $dpreqApplication, null, $dpreqApplication->toArray());

            $this->researchTeamNda->createForApplication($researchApplication);

            $this->dpreqWorkflow->submit($dpreqApplication);

            $remisApplication = RemisApplication::create([
                'research_application_id' => $researchApplication->id,
                'tracking_number' => $this->nextRemisTrackingNumber(),
                'applicant_id' => $applicant->id,
                'study_type' => $validated['study_type'],
                'study_design' => $validated['study_design'],
                'target_population' => $validated['target_population'],
                'participant_count' => $validated['participant_count'],
                'inclusion_criteria' => $validated['inclusion_criteria'],
                'exclusion_criteria' => $validated['exclusion_criteria'],
                'vulnerable_population' => $validated['vulnerable_population'] ?? false,
                'study_sites' => $validated['study_sites'],
                'funding_source' => $validated['funding_source'] ?? null,
                'risks_to_participants' => $validated['risks_to_participants'],
                'benefits' => $validated['benefits'],
                'confidentiality_measures' => $validated['confidentiality_measures'],
                'consent_process' => $validated['consent_process'],
                'data_storage_plan' => $validated['data_storage_plan'],
                'status' => 'draft_submitted',
            ]);

            $this->statusHistory->record($remisApplication, null, 'draft_submitted');
            $this->auditLog->record('remis_application.created', $remisApplication, null, $remisApplication->toArray());

            $this->remisWorkflow->submit($remisApplication);

            return $dpreqApplication->fresh(['researchApplication']);
        });
    }

    private function nextDpreqTrackingNumber(): string
    {
        $year = now()->year;
        $count = DpreqApplication::where('tracking_number', 'like', "DPREQ-{$year}-%")->lockForUpdate()->count();

        return sprintf('DPREQ-%d-%04d', $year, $count + 1);
    }

    private function nextRemisTrackingNumber(): string
    {
        $year = now()->year;
        $count = RemisApplication::where('tracking_number', 'like', "REC-{$year}-%")->lockForUpdate()->count();

        return sprintf('REC-%d-%04d', $year, $count + 1);
    }
}
