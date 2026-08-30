<?php

namespace App\Modules\Dpnda\Services;

use App\Models\User;
use App\Shared\Auth\Models\Role;
use App\Shared\Auth\Services\AdminUserService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

// Roadmap A3 / docs/2.x — OJT coordinators onboard whole batches of trainees from a CSV instead
// of filling the heavy one-trainee form N times at intake. Same account logic as the single
// placement flow (DpndaRecordController::store): an unknown email creates the trainee account and
// emails a setup link; a known email reuses the existing account. Preview-then-confirm, like the
// admin bulk user import (AdminUserService::previewImport/importUsers).
class DpndaImportService
{
    private const COLUMNS = [
        'trainee_email', 'trainee_last_name', 'trainee_first_name', 'gender', 'age',
        'enrolled_school', 'hours_needed', 'trainee_type', 'department', 'level', 'course',
        'section', 'department_assigned', 'pcc_supervisor', 'endorsed_by', 'start_date',
        'end_date', 'guardian_name',
    ];

    public function __construct(
        private readonly DpndaWorkflowService $workflow,
        private readonly AdminUserService $users,
    ) {
    }

    /**
     * Parse + validate without persisting. Returns one entry per CSV row:
     * ['row' => n, 'data' => [...], 'valid' => bool, 'reason' => ?string].
     */
    public function previewImport(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            throw ValidationException::withMessages(['file' => 'The file could not be read.']);
        }

        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);
            throw ValidationException::withMessages(['file' => 'The CSV appears to be empty.']);
        }

        $header = array_map(fn ($h) => strtolower(trim((string) $h)), $header);
        $missing = array_diff(['trainee_email', 'trainee_last_name', 'trainee_first_name', 'enrolled_school', 'trainee_type', 'department_assigned', 'start_date', 'end_date'], $header);
        if ($missing !== []) {
            fclose($handle);
            throw ValidationException::withMessages(['file' => 'Missing required column(s): ' . implode(', ', $missing) . '.']);
        }

        $rows = [];
        $seenEmails = [];
        $line = 1;

        while (($csv = fgetcsv($handle)) !== false) {
            $line++;
            if (array_filter($csv, fn ($v) => trim((string) $v) !== '') === []) {
                continue; // skip blank lines
            }

            $data = [];
            foreach ($header as $i => $column) {
                if (in_array($column, self::COLUMNS, true)) {
                    $value = trim((string) ($csv[$i] ?? ''));
                    $data[$column] = $value === '' ? null : $value;
                }
            }

            [$valid, $reason] = $this->validateRow($data, $seenEmails);
            if ($valid && $data['trainee_email'] !== null) {
                $seenEmails[] = strtolower($data['trainee_email']);
            }

            $rows[] = ['row' => $line, 'data' => $data, 'valid' => $valid, 'reason' => $reason];
        }

        fclose($handle);

        if ($rows === []) {
            throw ValidationException::withMessages(['file' => 'The CSV contains no data rows.']);
        }

        return $rows;
    }

    /**
     * Create placements + draft NDA records for the valid previewed rows.
     *
     * @return array{created: int, skipped: int, invited: int}
     */
    public function importPlacements(array $rows, int $coordinatorId): array
    {
        $created = 0;
        $skipped = 0;
        $invited = 0;

        foreach ($rows as $entry) {
            if (! ($entry['valid'] ?? false)) {
                $skipped++;
                continue;
            }

            $data = $entry['data'];
            $email = $data['trainee_email'];

            $trainee = User::where('email', $email)->first();
            if ($trainee === null) {
                $roleSlug = $data['trainee_type'] === 'external_ojt' ? 'ojt_trainee_external' : 'ojt_trainee_internal';
                $trainee = $this->users->createApplicant(
                    [
                        'name' => trim("{$data['trainee_first_name']} {$data['trainee_last_name']}"),
                        'email' => $email,
                        'role_id' => Role::where('name', $roleSlug)->value('id'),
                        'department' => $data['department'] ?? null,
                    ],
                    auditEvent: 'user.trainee_created_by_coordinator',
                );
                $invited++;
            }

            $placement = collect($data)->except(['trainee_email'])->all();
            $placement['trainee_id'] = $trainee->id;

            $this->workflow->createPlacement($placement, $coordinatorId);
            $created++;
        }

        return ['created' => $created, 'skipped' => $skipped, 'invited' => $invited];
    }

    /**
     * @return array{0: bool, 1: ?string}
     */
    private function validateRow(array $data, array $seenEmails): array
    {
        $email = $data['trainee_email'] ?? null;
        if ($email === null || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [false, 'trainee_email is missing or not a valid email.'];
        }
        if (in_array(strtolower($email), $seenEmails, true)) {
            return [false, "Duplicate email in file: {$email}."];
        }

        foreach (['trainee_last_name', 'trainee_first_name', 'enrolled_school', 'department_assigned'] as $field) {
            if (($data[$field] ?? null) === null) {
                return [false, "{$field} is required."];
            }
        }

        if (! in_array($data['trainee_type'] ?? null, ['internal_ojt', 'external_ojt', 'community_service'], true)) {
            return [false, 'trainee_type must be internal_ojt, external_ojt or community_service.'];
        }

        foreach (['start_date', 'end_date'] as $field) {
            if (($data[$field] ?? null) === null) {
                return [false, "{$field} is required."];
            }
            try {
                Carbon::parse($data[$field]);
            } catch (\Throwable) {
                return [false, "{$field} is not a valid date."];
            }
        }

        if (Carbon::parse($data['end_date'])->lt(Carbon::parse($data['start_date']))) {
            return [false, 'end_date must be on or after start_date.'];
        }

        if (($data['age'] ?? null) !== null && (! ctype_digit((string) $data['age']) || (int) $data['age'] < 1 || (int) $data['age'] > 120)) {
            return [false, 'age must be a number between 1 and 120.'];
        }

        if (($data['hours_needed'] ?? null) !== null && (! ctype_digit((string) $data['hours_needed']) || (int) $data['hours_needed'] < 1)) {
            return [false, 'hours_needed must be a positive whole number.'];
        }

        return [true, null];
    }
}
