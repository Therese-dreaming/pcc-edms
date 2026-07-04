<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DpoEformStatus;
use App\Enums\DpoEformType;
use App\Models\DpoEform;
use App\Models\User;
use App\Traits\HasAuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Core business logic for DPO Electronic Forms.
 *
 * Handles creation, drafting, submission, and auto-population of the 4
 * official DPO EFORMS (Forms 1, 2, 3, 5).
 *
 * @see \App\Models\DpoEform
 * @see \App\Enums\DpoEformType
 */
class DpoEformService
{
    use HasAuditLog;

    /**
     * Create a new draft DPO EFORM of the given type.
     */
    public function createDraft(DpoEformType $type, User $user, array $data = []): DpoEform
    {
        // For Forms 2 and 3, auto-populate from a linked Form 1 if provided
        if (in_array($type, [DpoEformType::Form2, DpoEformType::Form3], true)
            && !empty($data['source_form1_id'])) {
            $data = array_merge(
                $this->populateFromForm1((int) $data['source_form1_id']),
                $data,
            );
            unset($data['source_form1_id']);
        }

        $eform = DpoEform::create([
            'document_id'   => DpoEform::generateDocumentId($type),
            'form_type'     => $type->value,
            'status'        => DpoEformStatus::Draft->value,
            'researcher_id' => $user->id,
            'form_data'     => $data,
            'created_by'    => $user->id,
            'updated_by'    => $user->id,
        ]);

        $this->auditLog(
            'dpo-eform.created',
            "Created {$type->shortLabel()} draft ({$eform->document_id})",
            $eform,
        );

        return $eform;
    }

    /**
     * Save form data to an existing draft (or submitted form by admin).
     */
    public function saveDraft(DpoEform $eform, array $data, User $user): DpoEform
    {
        if (!$eform->isEditable() && !$user->hasRole('system-administrator')) {
            throw new RuntimeException('This form can no longer be edited.');
        }

        // Track version changes if form_data has changed
        $oldData = $eform->form_data ?? [];
        $hasChanges = $oldData !== $data;
        
        if ($hasChanges && !empty($oldData)) {
            // Determine what changed
            $changes = $this->detectChanges($oldData, $data);
            $changeDescription = $changes ?: 'Form data updated';
            
            // Add version entry
            $eform->addVersion(
                $user->name ?? 'User',
                $changeDescription
            );
        }
        
        // For Form 1 linked to a research application, detect if data was modified from source
        if ($eform->research_application_id && $eform->typeEnum() === DpoEformType::Form1) {
            $dataModified = $this->hasDataModifiedFromApplication($eform, $data);
            $eform->data_modified_from_source = $dataModified;
        }

        $eform->update([
            'form_data'  => $data,
            'data_modified_from_source' => $eform->data_modified_from_source ?? false,
            'updated_by' => $user->id,
        ]);

        $this->auditLog(
            'dpo-eform.updated',
            "Updated {$eform->typeEnum()->shortLabel()} ({$eform->document_id})",
            $eform,
        );

        return $eform->fresh();
    }
    
    /**
     * Check if Form 1 data has been modified from the source Ethics Application.
     *
     * Compares key fields between the form data and the source application.
     *
     * @param DpoEform $eform The Form 1 being checked
     * @param array $newData The new form data being saved
     * @return bool True if data differs from source application
     */
    protected function hasDataModifiedFromApplication(DpoEform $eform, array $newData): bool
    {
        if (!$eform->research_application_id) {
            return false;
        }
        
        $application = $eform->researchApplication;
        if (!$application) {
            return false;
        }
        
        // Compare key fields
        $comparisons = [
            'research_title' => $application->study_title,
            'researcher_name' => $application->researcher->name,
            'adviser_name' => $application->adviser->name ?? '',
            'department' => $application->department->name ?? '',
            'course' => $application->academicProgram->name ?? '',
            'respondents' => $application->target_population ?? '',
            'target_respondents' => (string)($application->num_participants ?? ''),
            'research_start' => $application->proposed_start_date?->format('Y-m-d') ?? '',
            'research_end' => $application->proposed_end_date?->format('Y-m-d') ?? '',
        ];
        
        foreach ($comparisons as $field => $originalValue) {
            $newValue = $newData[$field] ?? '';
            if ((string)$newValue !== (string)$originalValue) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Detect what changed between old and new form data.
     *
     * @return string A human-readable summary of changes
     */
    protected function detectChanges(array $oldData, array $newData): string
    {
        $changedFields = [];
        
        // Common fields to check
        $fieldsToCheck = [
            'research_title' => 'Research Title',
            'researcher_name' => 'Researcher Name',
            'adviser_name' => 'Adviser Name',
            'department' => 'Department',
            'level' => 'Level',
            'course' => 'Course',
            'section' => 'Section',
            'respondents' => 'Respondents',
            'target_respondents' => 'Target Respondents',
            'data_collection_method' => 'Data Collection Method',
            'data_capturing_tool' => 'Data Capturing Tool',
            'research_start' => 'Research Start Date',
            'research_end' => 'Research End Date',
        ];
        
        foreach ($fieldsToCheck as $key => $label) {
            $oldValue = $oldData[$key] ?? null;
            $newValue = $newData[$key] ?? null;
            
            if ($oldValue !== $newValue && ($oldValue !== null || $newValue !== null)) {
                $changedFields[] = $label;
            }
        }
        
        // Check if checklist changed
        if (isset($oldData['checklist']) && isset($newData['checklist'])) {
            if ($oldData['checklist'] !== $newData['checklist']) {
                $changedFields[] = 'Review Checklist';
            }
        }
        
        if (empty($changedFields)) {
            return 'Minor updates';
        }
        
        if (count($changedFields) <= 3) {
            return 'Updated: ' . implode(', ', $changedFields);
        }
        
        return 'Updated ' . count($changedFields) . ' fields';
    }

    /**
     * Submit a form (transition Draft → Submitted).
     */
    public function submitForm(DpoEform $eform, User $user): DpoEform
    {
        if (!$eform->isEditable()) {
            throw new RuntimeException('Only draft forms can be submitted.');
        }

        $eform->update([
            'status'       => DpoEformStatus::Submitted->value,
            'submitted_at' => now(),
            'updated_by'   => $user->id,
        ]);

        $this->auditLog(
            'dpo-eform.submitted',
            "Submitted {$eform->typeEnum()->shortLabel()} ({$eform->document_id})",
            $eform,
        );

        return $eform->fresh();
    }

    /**
     * Approve a form (used by DPO/Ethics Head for Form 3 clearance).
     */
    public function approveForm(DpoEform $eform, User $user): DpoEform
    {
        $eform->update([
            'status'      => DpoEformStatus::Approved->value,
            'approved_at' => now(),
            'updated_by'  => $user->id,
        ]);

        $this->auditLog(
            'dpo-eform.approved',
            "Approved {$eform->typeEnum()->shortLabel()} ({$eform->document_id})",
            $eform,
        );

        return $eform->fresh();
    }

    /**
     * Auto-populate Form 2 or Form 3 data from a source Form 1.
     *
     * @return array<string, mixed>
     */
    public function populateFromForm1(int $form1Id): array
    {
        $form1 = DpoEform::where('id', $form1Id)
            ->where('form_type', DpoEformType::Form1->value)
            ->firstOrFail();

        $src = $form1->form_data ?? [];

        // Carry over the shared research-detail fields verbatim
        return [
            'source_form1_document_id' => $form1->document_id,
            'research_title'           => $src['research_title'] ?? '',
            'researcher_name'          => $src['researcher_name'] ?? '',
            'group_size'               => $src['group_size'] ?? '',
            'group_size_other'         => $src['group_size_other'] ?? '',
            'adviser_name'             => $src['adviser_name'] ?? '',
            'department'               => $src['department'] ?? '',
            'level'                    => $src['level'] ?? '',
            'course'                   => $src['course'] ?? '',
            'section'                  => $src['section'] ?? '',
            'respondents'              => $src['respondents'] ?? '',
            'target_respondents'       => $src['target_respondents'] ?? '',
            'data_collection_method'   => $src['data_collection_method'] ?? '',
            'data_capturing_tool'      => $src['data_capturing_tool'] ?? '',
            'research_start'           => $src['research_start'] ?? '',
            'research_end'             => $src['research_end'] ?? '',
        ];
    }

    /**
     * Store an uploaded signature image (base64 data URL or UploadedFile)
     * and return the storage path.
     *
     * Signatures are stored under the `signatures` directory on the
     * documents disk so they render correctly in generated PDFs.
     */
    public function storeSignature(UploadedFile|string|null $signature, string $prefix = 'sig'): ?string
    {
        if ($signature === null || $signature === '') {
            return null;
        }

        // Handle UploadedFile instances
        if ($signature instanceof UploadedFile) {
            $fileName = Str::uuid() . '.png';
            return $signature->storeAs('signatures', $fileName, 'documents');
        }

        // Handle base64 data URL (e.g. "data:image/png;base64,....")
        if (is_string($signature) && str_starts_with($signature, 'data:image')) {
            $pattern = '/^data:image\/(\w+);base64,(.+)$/';
            if (preg_match($pattern, $signature, $matches)) {
                $data = base64_decode($matches[2]);
                if ($data === false) {
                    return null;
                }
                $ext = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
                $fileName = Str::uuid() . '.' . $ext;
                $path = 'signatures/' . $fileName;
                Storage::disk('documents')->put($path, $data);

                return $path;
            }
        }

        return null;
    }

    /**
     * Find a researcher's most recent Form 1 (for auto-populating Forms 2/3).
     */
    public function findLatestForm1ForUser(User $user): ?DpoEform
    {
        return DpoEform::where('researcher_id', $user->id)
            ->where('form_type', DpoEformType::Form1->value)
            ->latest()
            ->first();
    }
}
