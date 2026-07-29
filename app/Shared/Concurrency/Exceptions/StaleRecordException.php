<?php

namespace App\Shared\Concurrency\Exceptions;

use RuntimeException;

// Thrown when a save would overwrite a record that another user has modified since this copy was
// loaded (see App\Shared\Concurrency\Concerns\OptimisticLocking).
//
// Replaces the previously-referenced `Illuminate\Database\LockAcquisitionException`, which does
// NOT exist in Laravel (no version of the framework ships it, and `$optimisticLock` is not a
// framework feature). Both were referenced by the original Phase 8 implementation, which meant
// stale-write protection silently did nothing — the catch blocks could never match. Discovered
// 2026-07-25; see docs/CHANGELOG.md.
class StaleRecordException extends RuntimeException
{
    public function __construct(
        public readonly string $modelClass,
        public readonly mixed $modelKey,
    ) {
        parent::__construct(sprintf(
            'Record [%s #%s] was modified by another user since it was loaded. Refresh and try again.',
            class_basename($modelClass),
            (string) $modelKey,
        ));
    }
}
