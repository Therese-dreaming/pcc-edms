<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\Auth\Models\Role;
use App\Shared\Documents\Models\Document;
use App\Shared\Documents\Support\DocumentNaming;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

// Demo data for the File Management System (routes/files.php, FileManagerService). Creates a
// handful of applicants across departments, a DPREQ + REMIS application each, and — crucially —
// writes REAL files to Storage::disk('documents') alongside their Document rows so the File
// Manager has something browseable and downloadable. Every file is tagged 'generated' (system
// forms) or 'submitted' (applicant uploads), the two top-level categories.
//
// Idempotent: keyed on tracking numbers / emails via updateOrCreate, and it clears any previously
// seeded demo files (path prefix "DEMO/") before rewriting them so re-running never duplicates.
class FileManagerDemoSeeder extends Seeder
{
    public function run(): void
    {
        $disk = Storage::disk('documents');

        // Wipe prior demo files so a re-run is clean.
        foreach ($disk->directories('DEMO') as $dir) {
            $disk->deleteDirectory($dir);
        }
        Document::where('file_path', 'like', 'DEMO/%')->forceDelete();

        $dpoStaffId = User::whereHas('role', fn($q) => $q->where('name', 'dpo_staff'))->value('id')
            ?? User::query()->value('id');

        $applicants = [
            ['name' => 'Juan Dela Cruz', 'email' => 'juan.delacruz@pcc.test', 'role' => 'researcher_internal', 'department' => 'College of Computer Studies'],
            ['name' => 'Maria Santos', 'email' => 'maria.santos@pcc.test', 'role' => 'researcher_internal', 'department' => 'Senior High School'],
            ['name' => 'Pedro Reyes', 'email' => 'pedro.reyes@pcc.test', 'role' => 'researcher_external', 'department' => 'Junior High School'],
        ];

        foreach ($applicants as $index => $data) {
            $roleId = Role::where('name', $data['role'])->value('id');

            $applicant = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => 'password',
                    'role_id' => $roleId,
                    'department' => $data['department'],
                    'account_status' => 'active',
                    'email_verified_at' => now(),
                ],
            );

            $research = ResearchApplication::updateOrCreate(
                ['applicant_id' => $applicant->id, 'research_title' => "Demo Study {$index}: " . $data['name']],
                [
                    'research_category' => 'academic',
                    'contact_number' => '09170000000',
                    'researcher_count' => 1,
                    'adviser_name' => 'Adam Adviser',
                    'department' => $data['department'],
                    'respondents' => 'Students',
                    'target_respondent_count' => 100,
                    'data_collection_method' => 'survey_form',
                    'data_capturing_tool' => 'electronic_form',
                    'target_start_date' => now(),
                    'target_end_date' => now()->addMonths(3),
                    'overall_status' => 'in_progress',
                ],
            );

            $year = now()->format('Y');
            $seq = str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT);

            // ---- DPREQ application + files -------------------------------------------------
            $dpreqTracking = "DPREQ-{$year}-{$seq}";
            $dpreq = DpreqApplication::updateOrCreate(
                ['tracking_number' => $dpreqTracking],
                [
                    'research_application_id' => $research->id,
                    'applicant_id' => $applicant->id,
                    'applicant_type' => $data['role'] === 'researcher_external' ? 'external_researcher' : 'internal_researcher',
                    'department' => $data['department'],
                    'purpose' => 'Demo data-privacy clearance request.',
                    'data_types' => ['name', 'email'],
                    'data_subjects' => ['students'],
                    'retention_plan' => 'Deleted after study completion.',
                    'third_party_sharing' => false,
                    'status' => 'under_review',
                ],
            );

            $dpreqRepo = "DEMO/DPO/DPREQ/{$year}/{$dpreqTracking}";
            // A system-generated form + an applicant-submitted upload.
            $this->writeFile($disk, $dpreq, 'DPREQ', $data['department'], $dpreqTracking, $dpreqRepo, 'DATAPRIVACYFORM', 'generated', 'pdf', $dpoStaffId);
            $this->writeFile($disk, $dpreq, 'DPREQ', $data['department'], $dpreqTracking, $dpreqRepo, 'CONSENTLETTER', 'submitted', 'pdf', $applicant->id, 'Signed Consent Letter.pdf');

            // ---- REMIS application + files -------------------------------------------------
            $remisTracking = "REMIS-{$year}-{$seq}";
            $remis = RemisApplication::updateOrCreate(
                ['tracking_number' => $remisTracking],
                [
                    'research_application_id' => $research->id,
                    'applicant_id' => $applicant->id,
                    'study_type' => 'thesis_dissertation',
                    'study_design' => 'quantitative',
                    'target_population' => 'PCC students',
                    'participant_count' => 100,
                    'inclusion_criteria' => 'Enrolled students',
                    'exclusion_criteria' => 'None',
                    'study_sites' => 'PCC Main Campus',
                    'risks_to_participants' => 'Minimal',
                    'benefits' => 'Academic insight',
                    'confidentiality_measures' => 'Anonymized data',
                    'consent_process' => 'Written informed consent',
                    'data_storage_plan' => 'Encrypted cloud storage',
                    'status' => 'for_review',
                ],
            );

            $remisRepo = "DEMO/ORD/REMIS/{$year}/{$remisTracking}";
            $this->writeFile($disk, $remis, 'REMIS', $data['department'], $remisTracking, $remisRepo, 'ETHICSFORM', 'generated', 'pdf', $dpoStaffId);
            $this->writeFile($disk, $remis, 'REMIS', $data['department'], $remisTracking, $remisRepo, 'RESEARCHPROPOSAL', 'submitted', 'pdf', $applicant->id, 'Research Proposal Final.pdf');
            $this->writeFile($disk, $remis, 'REMIS', $data['department'], $remisTracking, $remisRepo, 'QUESTIONNAIRE', 'submitted', 'txt', $applicant->id, 'Survey Questionnaire.txt');
        }

        $this->command?->info('File Manager demo files seeded under storage/app/documents/DEMO/.');
    }

    /**
     * Write a real file to the documents disk (following the REC-... naming convention) and create
     * its Document row with the correct source flag.
     */
    private function writeFile(
        $disk,
        $documentable,
        string $module,
        string $department,
        string $tracking,
        string $repositoryPath,
        string $label,
        string $source,
        string $extension,
        int $uploadedBy,
        ?string $originalName = null,
    ): void {
        $version = 1;
        $filename = DocumentNaming::filename($module, $department, $tracking, $label, $version, $extension);
        $storedPath = $repositoryPath . '/' . $filename;

        $bytes = $this->sampleContent($extension, $label, $tracking, $source);
        $disk->put($storedPath, $bytes);

        $mime = match ($extension) {
            'pdf' => 'application/pdf',
            'txt' => 'text/plain',
            default => 'application/octet-stream',
        };

        Document::create([
            'documentable_type' => $documentable->getMorphClass(),
            'documentable_id' => $documentable->getKey(),
            'document_type' => $label,
            'file_path' => $storedPath,
            'original_filename' => $originalName ?? $filename,
            'mime_type' => $mime,
            'size_bytes' => strlen($bytes),
            'version' => $version,
            'uploaded_by' => $uploadedBy,
            'source' => $source,
            'is_current_version' => true,
        ]);
    }

    // Minimal but valid file bytes so preview/download actually open something. A hand-written
    // single-page PDF for .pdf, plain text otherwise.
    private function sampleContent(string $extension, string $label, string $tracking, string $source): string
    {
        $line = "{$label} — {$tracking} ({$source})";

        if ($extension !== 'pdf') {
            return "PCC-EDMS demo document\n{$line}\n\nThis is sample content for the File Manager.\n";
        }

        $text = "PCC-EDMS Demo Document  |  {$line}";
        $stream = "BT /F1 14 Tf 60 760 Td ({$text}) Tj ET";
        $len = strlen($stream);

        return "%PDF-1.4\n"
            . "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            . "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
            . "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n"
            . "4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
            . "5 0 obj<</Length {$len}>>stream\n{$stream}\nendstream endobj\n"
            . "xref\n0 6\n0000000000 65535 f \n"
            . "trailer<</Root 1 0 R/Size 6>>\n"
            . "startxref\n0\n%%EOF";
    }
}
