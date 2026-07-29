<?php

namespace App\Shared\ResearchApplications\Services;

use App\Models\User;
use App\Modules\Dpreq\Mail\CoResearcherInvitationMail;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Dpreq\Services\DpreqWorkflowService;
use App\Modules\Dpreq\Services\ResearchTeamNdaService;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Services\RemisWorkflowService;
use App\Shared\Auth\Services\AdminUserService;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\Documents\Services\DocumentService;
use App\Shared\Onboarding\Services\CohortService;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use App\Shared\ResearchApplications\Support\ApplicationDocuments;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

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
        private readonly CohortService $cohorts,
        private readonly DocumentService $documents,
        private readonly AdminUserService $adminUsers,
    ) {
    }

    /**
     * B3 (concern 3.4) — a System Administrator reassigns a research application to a new lead
     * (e.g. the original leader transferred schools). Only the "current owner" pointer moves on
     * the shared row and both tracks; already-submitted documents and NDA signatures are never
     * altered (the outgoing leader stays on the roster as an immutable historical signatory). The
     * outgoing account is deactivated — kept for audit, but can no longer log in.
     */
    public function transferOwnership(ResearchApplication $researchApplication, User $newLeader, User $admin): ResearchApplication
    {
        return DB::transaction(function () use ($researchApplication, $newLeader, $admin) {
            $previousLeader = $researchApplication->applicant;

            $researchApplication->update(['applicant_id' => $newLeader->id]);
            $researchApplication->dpreqApplication?->update(['applicant_id' => $newLeader->id]);
            $researchApplication->remisApplication?->update(['applicant_id' => $newLeader->id]);

            $this->auditLog->record(
                'research_application.ownership_transferred',
                $researchApplication,
                ['applicant_id' => $previousLeader?->id],
                ['applicant_id' => $newLeader->id, 'transferred_by' => $admin->id],
            );

            // Note it on each track's timeline (same-status entry, so the audit reads as one story).
            $note = sprintf(
                'Ownership transferred from %s to %s by %s.',
                $previousLeader?->name ?? 'previous leader',
                $newLeader->name,
                $admin->name,
            );
            foreach ([$researchApplication->dpreqApplication, $researchApplication->remisApplication] as $track) {
                if ($track !== null) {
                    $this->statusHistory->record($track, $track->status, $track->status, $note);
                }
            }

            // Deactivate the outgoing account. Its NDA signature / uploaded documents are retained
            // (their FKs are nullOnDelete/kept, and we are not deleting the user anyway).
            if ($previousLeader !== null && $previousLeader->id !== $newLeader->id) {
                $this->adminUsers->updateUser($previousLeader, ['account_status' => 'deactivated']);
            }

            return $researchApplication->fresh();
        });
    }

    public function submitForm1(array $validated, User $applicant): DpreqApplication
    {
        $dpreqApplication = DB::transaction(function () use ($validated, $applicant) {
            $researchApplication = ResearchApplication::create([
                'applicant_id' => $applicant->id,
                'research_title' => $validated['research_title'],
                'contact_number' => $validated['contact_number'] ?? null,
                'researcher_count' => $validated['researcher_count'],
                // Parked here until DPO approval, when the Research Team NDA is created and each
                // co-researcher is emailed a signing link (concern 7 — signing happens after
                // approval, not at submission).
                'co_researchers' => array_values($validated['co_researchers'] ?? []),
                'research_category' => $this->resolveChoice($validated, 'research_category'),
                'adviser_name' => $validated['adviser_name'],
                'applicant_category' => $validated['applicant_category'] ?? 'student',
                'department' => $validated['department'] ?? null,
                'level' => $validated['level'] ?? null,
                'course' => $validated['course'] ?? null,
                'section' => $validated['section'] ?? null,
                'position' => $validated['position'] ?? null,
                'respondents' => $validated['respondents'],
                'target_respondent_count' => $validated['target_respondent_count'],
                'data_collection_method' => $this->resolveChoice($validated, 'data_collection_method'),
                'data_capturing_tool' => $this->resolveChoice($validated, 'data_capturing_tool'),
                'target_start_date' => $validated['target_start_date'],
                'target_end_date' => $validated['target_end_date'],
                'minors_involved' => $validated['minors_involved'] ?? false,
                'respondent_head_letter_approved' => $validated['respondent_head_letter_approved'] ?? false,
                'review_checklist' => $validated['review_checklist'] ?? null,
                'researcher_signature' => $validated['researcher_signature'] ?? null,
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

            // The Research Team NDA is NOT created here. Signing must not open until the DPO has
            // approved (concern 7); DpreqWorkflowService::approve() creates the NDA and emails each
            // co-researcher (captured above in `co_researchers`) their single-use signing link.

            $this->dpreqWorkflow->submit($dpreqApplication);

            $remisApplication = RemisApplication::create([
                'research_application_id' => $researchApplication->id,
                'tracking_number' => $this->nextRemisTrackingNumber(),
                'applicant_id' => $applicant->id,
                // Route the endorsement chain's first step to the applicant's own adviser, taken
                // from their class cohort (2026-07-25). Null for applicants who belong to no cohort
                // — those fall back to notifying the adviser role at large, as before.
                'adviser_id' => $this->cohorts->adviserFor($applicant)?->id,
                'study_type' => $this->resolveChoice($validated, 'study_type'),
                'study_design' => $this->resolveChoice($validated, 'study_design'),
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

            // FRS §III.E — store the intake documents. Ethics documents attach to the REMIS
            // application; item-6 additional documents attach to the DPREQ (DPO) side.
            $this->storeIntakeDocuments($validated, $researchApplication, $remisApplication, $dpreqApplication);

            return $dpreqApplication->fresh(['researchApplication']);
        });

        // After the submission commits, send each named co-researcher a heads-up invitation so they
        // know they were added the moment the form is submitted. It carries NO signing link — the
        // Research Team NDA and its single-use signing links are created only when the DPO approves
        // (concern 7 / B1). Guarded + outside the transaction so an SMTP hiccup can never undo a
        // valid submission.
        foreach ($validated['co_researchers'] ?? [] as $member) {
            $email = trim((string) ($member['email'] ?? ''));
            if ($email === '') {
                continue;
            }

            try {
                Mail::to($email)->send(new CoResearcherInvitationMail(
                    memberName: (string) ($member['full_name'] ?? ''),
                    researchTitle: $validated['research_title'],
                    leadName: $applicant->name,
                    trackingNumber: $dpreqApplication->tracking_number,
                ));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return $dpreqApplication;
    }

    /**
     * Apply an edit to the Form-1 fields of a submitted application (stakeholder 2026-07-28). Updates
     * the shared research_application (Section A/B) and its DPREQ track (Section III), collapsing any
     * "other" dropdown choice. Returns true when a Form-1 field actually changed, so the caller can
     * regenerate the Form 1 PDF — and skip regeneration (and the version bump) when nothing changed.
     */
    public function updateForm1(DpreqApplication $dpreqApplication, array $validated, User $editor): bool
    {
        return DB::transaction(function () use ($dpreqApplication, $validated, $editor) {
            $research = $dpreqApplication->researchApplication;

            $research->fill([
                'research_title' => $validated['research_title'],
                'adviser_name' => $validated['adviser_name'],
                'applicant_category' => $validated['applicant_category'],
                'department' => $validated['department'] ?? null,
                'level' => $validated['level'] ?? null,
                'course' => $validated['course'] ?? null,
                'section' => $validated['section'] ?? null,
                'position' => $validated['position'] ?? null,
                'respondents' => $validated['respondents'],
                'target_respondent_count' => $validated['target_respondent_count'],
                'data_collection_method' => $this->resolveChoice($validated, 'data_collection_method'),
                'data_capturing_tool' => $this->resolveChoice($validated, 'data_capturing_tool'),
                'target_start_date' => $validated['target_start_date'],
                'target_end_date' => $validated['target_end_date'],
                'minors_involved' => $validated['minors_involved'] ?? false,
                'respondent_head_letter_approved' => $validated['respondent_head_letter_approved'] ?? false,
                'review_checklist' => $validated['review_checklist'] ?? $research->review_checklist,
            ]);
            if (! empty($validated['researcher_signature'])) {
                $research->researcher_signature = $validated['researcher_signature'];
            }

            $dpreqApplication->fill([
                'purpose' => $validated['purpose'],
                'data_types' => $validated['data_types'],
                'data_subjects' => $validated['data_subjects'],
                'retention_plan' => $validated['retention_plan'],
                'third_party_sharing' => $validated['third_party_sharing'] ?? false,
                'third_party_detail' => $validated['third_party_detail'] ?? null,
            ]);

            $changedFields = array_merge(array_keys($research->getDirty()), array_keys($dpreqApplication->getDirty()));

            $research->save();
            $dpreqApplication->save();

            if ($changedFields !== []) {
                $this->auditLog->record('research_application.form1_edited', $dpreqApplication, null, [
                    'fields' => $changedFields,
                    'edited_by' => $editor->id,
                ]);
            }

            // Every field editable here appears on Form 1, so any change means the PDF is stale.
            return $changedFields !== [];
        });
    }

    private function storeIntakeDocuments(
        array $validated,
        ResearchApplication $researchApplication,
        RemisApplication $remisApplication,
        DpreqApplication $dpreqApplication,
    ): void {
        $department = $researchApplication->department;
        $year = now()->year;

        // Fixed FRS §III.E slots -> Ethics (REMIS) track. Each slot may hold several files
        // (stakeholder 2026-07-28 — e.g. multiple research instruments); DocumentService versions
        // repeats of the same label (V1, V2, ...).
        foreach (ApplicationDocuments::SLOTS as $key => $slot) {
            $files = $validated['documents'][$key] ?? [];
            // Tolerate a single UploadedFile as well as an array of them.
            foreach (is_array($files) ? $files : [$files] as $file) {
                if ($file === null) {
                    continue;
                }

                $this->documents->store(
                    $remisApplication,
                    $file,
                    $slot['label'],
                    'REMIS',
                    $remisApplication->tracking_number,
                    "ORD/REMIS/{$year}/{$remisApplication->tracking_number}",
                    $department,
                );
            }
        }

        // Additional supporting documents (item 6) -> DPO (DPREQ) track, each with its chosen label.
        foreach ($validated['additional_documents'] ?? [] as $entry) {
            $this->documents->store(
                $dpreqApplication,
                $entry['file'],
                $entry['label'],
                'DPREQ',
                $dpreqApplication->tracking_number,
                "DPO/DPREQ/{$year}/{$dpreqApplication->tracking_number}",
                $department,
            );
        }
    }

    /**
     * Collapse an "Others (specify)" dropdown into a single stored value: when the applicant picked
     * "other", persist the free text they typed in the companion `{field}_other`; otherwise persist
     * the chosen token as-is (stakeholder 2026-07-28).
     */
    private function resolveChoice(array $validated, string $field): ?string
    {
        $value = $validated[$field] ?? null;

        if ($value === 'other') {
            $other = trim((string) ($validated["{$field}_other"] ?? ''));

            return $other !== '' ? $other : null;
        }

        return $value;
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
