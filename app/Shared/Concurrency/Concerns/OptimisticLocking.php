<?php

namespace App\Shared\Concurrency\Concerns;

use App\Shared\Concurrency\Exceptions\StaleRecordException;
use Illuminate\Database\Eloquent\Builder;

// Optimistic locking for workflow records that several staff can act on at once (a DPREQ being
// screened/endorsed/approved, a REMIS application being decided). Prevents the "last write
// silently wins" case where two reviewers load the same application and the slower save
// clobbers the faster one's decision.
//
// How it works: every update is guarded by `WHERE version = <value loaded with this instance>`
// and bumps `version` in the same statement. If another writer got there first the version no
// longer matches, zero rows are affected, and StaleRecordException is thrown instead of a silent
// overwrite.
//
// Why a dedicated integer column rather than `updated_at` (which the original, non-functional
// Phase 8 code named): `updated_at` is stored at one-second precision, so two saves inside the
// same second carry an identical timestamp and would NOT be detected as a conflict. A counter has
// no such blind spot. It also sidesteps MySQL's default "affected rows = changed rows" behaviour
// — because `version` always changes, a matched row always reports at least one affected row, so
// a no-op save can never be mistaken for a conflict.
trait OptimisticLocking
{
    public static function bootOptimisticLocking(): void
    {
        static::creating(function (self $model): void {
            $column = $model->optimisticLockColumn();

            if ($model->{$column} === null) {
                $model->{$column} = 1;
            }
        });
    }

    public function optimisticLockColumn(): string
    {
        return 'version';
    }

    protected function performUpdate(Builder $query)
    {
        // Mirrors Illuminate\Database\Eloquent\Model::performUpdate(), adding the version guard.
        if ($this->fireModelEvent('updating') === false) {
            return false;
        }

        if ($this->usesTimestamps()) {
            $this->updateTimestamps();
        }

        $column = $this->optimisticLockColumn();
        $loadedVersion = $this->getRawOriginal($column);

        // Rows created before this column existed have no version to compare — fall back to the
        // framework's unguarded behaviour rather than blocking the save outright.
        $guarded = $loadedVersion !== null;

        if ($guarded) {
            $this->setAttribute($column, (int) $loadedVersion + 1);
        }

        $dirty = $this->getDirtyForUpdate();

        if (count($dirty) > 0) {
            $update = $this->setKeysForSaveQuery($query);

            if ($guarded) {
                $update->where($column, $loadedVersion);
            }

            $affected = $update->update($dirty);

            if ($guarded && $affected === 0) {
                // Restore the in-memory version so the caller can refresh() and retry cleanly.
                $this->setAttribute($column, $loadedVersion);

                throw new StaleRecordException(static::class, $this->getKey());
            }

            $this->syncChanges();

            $this->fireModelEvent('updated', false);
        }

        return true;
    }
}
