<?php

namespace App\Shared\Concurrency\Concerns;

use App\Shared\Concurrency\Exceptions\StaleRecordException;
use Illuminate\Database\Eloquent\Model;

// Controller-side half of optimistic locking. The model-level guard
// (App\Shared\Concurrency\Concerns\OptimisticLocking) only catches true races, because route-model
// binding re-loads the record fresh at the start of every request — so by the time a controller
// saves, its own copy is never stale.
//
// The realistic conflict is slower: a reviewer opens an application, someone else decides it, and
// the first reviewer then submits a form rendered from the now-outdated page. To catch that, the
// page submits the `version` it rendered and this compares it against the current row.
trait ChecksRecordVersion
{
    /**
     * @param  mixed  $expectedVersion  the version the client rendered its form from; when absent
     *                                  (older page, or a caller that doesn't send it) the check is
     *                                  skipped rather than blocking the action.
     *
     * @throws StaleRecordException
     */
    protected function assertNotStale(Model $model, mixed $expectedVersion): void
    {
        if ($expectedVersion === null || $expectedVersion === '') {
            return;
        }

        if ((int) $expectedVersion !== (int) $model->getAttribute('version')) {
            throw new StaleRecordException($model::class, $model->getKey());
        }
    }
}
