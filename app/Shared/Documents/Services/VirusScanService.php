<?php

namespace App\Shared\Documents\Services;

use App\Shared\AuditLog\Services\AuditLogService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\ValidationException;
use RuntimeException;

// Roadmap Phase C (2026-08-31) — ClamAV scanning of every uploaded file, hooked into
// DocumentService::store() (the single entry point for all module uploads). Disabled by
// default; fail-CLOSED when enabled but unavailable (see config/antivirus.php). The file is
// never persisted when infected — the scan happens before any Storage write.
class VirusScanService
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    /**
     * @throws ValidationException when the file is infected
     * @throws RuntimeException when scanning is enabled but the scanner cannot run
     */
    public function scan(UploadedFile $file): void
    {
        if (! config('antivirus.enabled', false)) {
            return;
        }

        $binary = (string) config('antivirus.scanner_binary', 'clamscan');

        try {
            $result = Process::timeout((int) config('antivirus.timeout', 60))
                ->run([$binary, '--no-summary', $file->getRealPath()]);
        } catch (\Throwable $e) {
            Log::error('Antivirus scan could not run.', ['binary' => $binary, 'error' => $e->getMessage()]);
            throw new RuntimeException('The virus scanner is currently unavailable, so this upload was rejected. Contact the system administrator.');
        }

        // clamscan exit codes: 0 = clean, 1 = virus found, 2+ = scanner error.
        if ($result->exitCode() === 0) {
            return;
        }

        if ($result->exitCode() === 1) {
            $this->auditLog->record('document.virus_detected', null, null, [
                'original_filename' => $file->getClientOriginalName(),
                'scanner' => $binary,
            ]);
            Log::warning('Infected upload rejected.', ['original_filename' => $file->getClientOriginalName()]);

            throw ValidationException::withMessages([
                'file' => 'This file failed the virus scan and was rejected. It was not stored.',
            ]);
        }

        Log::error('Antivirus scanner returned an error.', ['exit' => $result->exitCode(), 'output' => $result->errorOutput()]);
        throw new RuntimeException('The virus scanner reported an error, so this upload was rejected. Contact the system administrator.');
    }
}
