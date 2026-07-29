<?php

namespace App\Shared\Revisions\Services;

use App\Models\User;
use App\Shared\AuditLog\Services\AuditLogService;
use Illuminate\Database\Eloquent\Model;
use RuntimeException;

// Applies field edits to a submitted application while it is returned/for_revision, recording each
// as an ApplicationAmendment (old -> new + reason) and an audit entry. The confirmed edit policy:
// applicants may always ADD (documents, revision responses); editing an existing answer is only
// possible in a returned state and is never a silent overwrite.
class AmendmentService
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    /**
     * Apply a map of field => new value to $model, recording an amendment per actually-changed
     * field. `$editableStatuses` are the statuses in which editing is allowed; the model's current
     * `status` must be one of them.
     *
     * @param  array<string, mixed>  $changes
     * @param  list<string>  $editableStatuses
     * @return int number of fields amended
     */
    public function apply(Model $model, array $changes, string $reason, User $editor, array $editableStatuses): int
    {
        if (! in_array($model->getAttribute('status'), $editableStatuses, true)) {
            throw new RuntimeException('This application can only be edited while it is returned for revision.');
        }

        $amended = 0;

        foreach ($changes as $field => $newValue) {
            // Only fields the model actually exposes as fillable may be amended.
            if (! $model->isFillable($field)) {
                throw new RuntimeException("Field [{$field}] cannot be amended.");
            }

            $oldValue = $model->getAttribute($field);

            if ((string) $oldValue === (string) $newValue) {
                continue; // no-op
            }

            $model->amendments()->create([
                'field' => $field,
                'old_value' => $this->stringify($oldValue),
                'new_value' => $this->stringify($newValue),
                'reason' => $reason,
                'amended_by' => $editor->id,
            ]);

            $model->setAttribute($field, $newValue);
            $amended++;
        }

        if ($amended > 0) {
            $model->save();
            $this->auditLog->record('application.amended', $model, null, [
                'fields' => array_keys($changes),
                'reason' => $reason,
            ]);
        }

        return $amended;
    }

    private function stringify(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return is_array($value) ? json_encode($value) : (string) $value;
    }
}
