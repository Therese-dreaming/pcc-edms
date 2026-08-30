<?php

namespace Tests\Feature;

use App\Shared\Documents\Services\VirusScanService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;
// Roadmap Phase C — antivirus gate (config/antivirus.php). Disabled by default (no-op),
// fail-closed when enabled: infected files are rejected with a validation error, and a scanner
// that cannot run rejects the upload instead of waving it through.
class VirusScanTest extends TestCase
{
    use RefreshDatabase;

    private function file(): UploadedFile
    {
        return UploadedFile::fake()->create('proposal.pdf', 10, 'application/pdf');
    }

    /** @test */
    public function scanning_is_a_no_op_when_disabled(): void
    {
        config(['antivirus.enabled' => false]);
        Process::fake();

        app(VirusScanService::class)->scan($this->file());

        Process::assertNothingRan();
    }

    /** @test */
    public function a_clean_file_passes_when_scanning_is_enabled(): void
    {
        config(['antivirus.enabled' => true]);
        Process::fake(['clamscan*' => Process::result('', exitCode: 0)]);

        app(VirusScanService::class)->scan($this->file());

        Process::assertRan(fn ($process) => str_starts_with(
            is_array($process->command) ? ($process->command[0] ?? '') : (string) $process->command,
            'clamscan',
        ));
    }

    /** @test */
    public function an_infected_file_is_rejected_with_a_validation_error(): void
    {
        config(['antivirus.enabled' => true]);
        Process::fake(['clamscan*' => Process::result('proposal.pdf: Eicar-Signature FOUND', exitCode: 1)]);

        $this->expectException(ValidationException::class);

        app(VirusScanService::class)->scan($this->file());
    }

    /** @test */
    public function a_broken_scanner_fails_closed(): void
    {
        config(['antivirus.enabled' => true]);
        Process::fake(['clamscan*' => Process::result(errorOutput: 'ERROR: Cant open file', exitCode: 2)]);

        $this->expectException(\RuntimeException::class);

        app(VirusScanService::class)->scan($this->file());
    }
}
