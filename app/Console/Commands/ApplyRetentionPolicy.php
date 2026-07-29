<?php

namespace App\Console\Commands;

use App\Shared\Documents\Services\RetentionService;
use Illuminate\Console\Command;

// stakeholder-additional-features.md (2026-07-25) — "Configurable file retention policies".
// Retention schedule confirmed 2026-07-07 (docs/HANDOFF.md Part K): 7 years for issued clearances,
// 3 years for rejected/inactive records. Configured in config/retention.php.
//
// Reports by default and deletes nothing. Purging institutional records is irreversible, so it
// requires BOTH --purge on the command AND retention.purge_enabled in the environment — one flag
// alone is not enough to destroy anything. Even then, only archived document FILES are removed;
// the Document rows (soft-deleted), the application records, and the audit trail all survive, so
// there is a permanent record that disposal happened.
class ApplyRetentionPolicy extends Command
{
    protected $signature = 'edms:apply-retention {--purge : Actually delete archived files for eligible records (also requires RETENTION_PURGE_ENABLED=true)}';

    protected $description = 'Report (or, with --purge, dispose of) records whose retention window has elapsed';

    public function handle(RetentionService $retention): int
    {
        $issuedYears = (int) config('retention.issued_years');
        $rejectedYears = (int) config('retention.rejected_years');

        $this->info("Retention schedule: issued clearances {$issuedYears} years · rejected/inactive {$rejectedYears} years");
        $this->newLine();

        $eligible = $retention->eligibleForPurge();
        $total = $eligible['issued']->count() + $eligible['rejected']->count();

        if ($total === 0) {
            $this->info('Nothing has passed its retention window. No action needed.');

            return self::SUCCESS;
        }

        foreach (['issued' => 'Issued clearances past retention', 'rejected' => 'Rejected/inactive past retention'] as $key => $heading) {
            if ($eligible[$key]->isEmpty()) {
                continue;
            }

            $this->line("<comment>{$heading}: {$eligible[$key]->count()}</comment>");
            $this->table(
                ['Record', 'Reason'],
                $eligible[$key]->map(fn (array $row) => [$row['label'], $row['reason']])->all(),
            );
        }

        $purgeRequested = (bool) $this->option('purge');
        $purgeAllowed = (bool) config('retention.purge_enabled');

        if (! $purgeRequested) {
            $this->newLine();
            $this->info('Dry run — nothing was deleted. Re-run with --purge to dispose of archived files.');

            return self::SUCCESS;
        }

        if (! $purgeAllowed) {
            $this->newLine();
            $this->warn('--purge was requested but RETENTION_PURGE_ENABLED is false, so nothing was deleted.');
            $this->line('Set RETENTION_PURGE_ENABLED=true in the environment to allow disposal.');

            return self::FAILURE;
        }

        $removed = 0;

        foreach (['issued', 'rejected'] as $key) {
            foreach ($eligible[$key] as $row) {
                $removed += $retention->purgeArchivedFiles($row['record']);
            }
        }

        $this->newLine();
        $this->info("Disposed of {$removed} archived file(s) across {$total} record(s). Document rows and audit trail retained.");

        return self::SUCCESS;
    }
}
