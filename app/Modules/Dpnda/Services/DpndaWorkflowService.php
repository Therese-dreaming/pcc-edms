<?php

namespace App\Modules\Dpnda\Services;

use App\Modules\Dpnda\Jobs\GenerateDpndaPdfJob;
use App\Modules\Dpnda\Models\DpndaRecord;
use App\Modules\Dpnda\Models\Placement;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\AuditLog\Support\SignatureIdentity;
use App\Shared\Notifications\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use RuntimeException;

// docs/2.2-dpnda-workflow.md — OJT/Trainee NDA (Form 5) status lifecycle, enforced the same way
// as Modules\Dpreq\Services\DpreqWorkflowService: every transition checked against
// DpndaRecord::LEGAL_TRANSITIONS, writes status_history + audit_log.
class DpndaWorkflowService
{
    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
        private readonly NotificationService $notifications,
    ) {
    }

    public function createPlacement(array $validated, int $coordinatorId): DpndaRecord
    {
        return DB::transaction(function () use ($validated, $coordinatorId) {
            $placement = Placement::create([
                ...$validated,
                'coordinator_id' => $coordinatorId,
            ]);

            $record = DpndaRecord::create([
                'placement_id' => $placement->id,
                'tracking_number' => $this->nextTrackingNumber(),
                'status' => 'draft',
                'guardian_name' => $validated['guardian_name'] ?? null,
            ]);

            $this->statusHistory->record($record, null, 'draft');
            $this->auditLog->record('dpnda_record.created', $record, null, $record->toArray());

            return $record;
        });
    }

    public function sendForSigning(DpndaRecord $record): DpndaRecord
    {
        $record = $this->transition($record, 'sent_for_signing', 'dpnda_record.sent_for_signing');

        // docs/2.2 "Notifications": NDA ready for signing -> Trainee.
        $this->notifications->notifyUser($record->placement->trainee, 'NDA ready for signing', "Your OJT/Trainee NDA {$record->tracking_number} is ready for your signature.", $record);

        return $record;
    }

    public function traineeSign(DpndaRecord $record, string $typedFullName, ?string $signatureImage = null): DpndaRecord
    {
        // Lock first, then write signature fields, then transition — same pattern as
        // coordinatorCountersign(). Writing before the lock would let a concurrent request
        // overwrite signature data on a record whose transition is about to fail.
        return DB::transaction(function () use ($record, $typedFullName, $signatureImage) {
            $locked = DpndaRecord::lockForUpdate()->findOrFail($record->id);

            if (! $locked->canTransitionTo('trainee_signed')) {
                throw new RuntimeException("Illegal DPNDA transition: {$locked->status} -> trainee_signed.");
            }

            $identity = SignatureIdentity::capture();

            $locked->update([
                'trainee_signature_id' => $typedFullName,
                'trainee_signature_image' => $signatureImage,
                'trainee_signature_ip' => $identity['ip'],
                'trainee_signature_user_agent' => $identity['user_agent'],
                'trainee_signed_at' => now(),
            ]);

            $locked = $this->transition($locked, 'trainee_signed', 'dpnda_record.trainee_signed');

            // docs/2.2: Trainee signed -> Dept Coordinator.
            $this->notifications->notifyUser($locked->placement->coordinator, 'Trainee signed NDA', "{$locked->placement->traineeFullName()} signed NDA {$locked->tracking_number} — countersignature needed.", $locked);

            return $locked;
        });
    }

    public function decline(DpndaRecord $record, string $reason): DpndaRecord
    {
        // Lock before writing decline_reason — same pattern as traineeSign()/coordinatorCountersign().
        return DB::transaction(function () use ($record, $reason) {
            $locked = DpndaRecord::lockForUpdate()->findOrFail($record->id);

            if (! $locked->canTransitionTo('declined')) {
                throw new RuntimeException("Illegal DPNDA transition: {$locked->status} -> declined.");
            }

            $locked->update(['decline_reason' => $reason]);

            $locked = $this->transition($locked, 'declined', 'dpnda_record.declined', $reason);

            // docs/2.2: Declined -> Dept Coordinator + DPO.
            $this->notifications->notifyUser($locked->placement->coordinator, 'NDA declined', "{$locked->placement->traineeFullName()} declined NDA {$locked->tracking_number}: \"{$reason}\"", $locked);
            $this->notifications->notifyRole('dpo_staff', 'NDA declined', "NDA {$locked->tracking_number} was declined by the trainee: \"{$reason}\"", $locked);

            return $locked;
        });
    }

    public function coordinatorCountersign(DpndaRecord $record, string $typedFullName, ?string $signatureImage = null): DpndaRecord
    {
        return DB::transaction(function () use ($record, $typedFullName, $signatureImage) {
            $locked = DpndaRecord::lockForUpdate()->findOrFail($record->id);

            if (! $locked->canTransitionTo('coordinator_countersigned')) {
                throw new RuntimeException("Illegal DPNDA transition: {$locked->status} -> coordinator_countersigned.");
            }

            $identity = SignatureIdentity::capture();

            $locked->update([
                'coordinator_signature_id' => $typedFullName,
                'coordinator_signature_image' => $signatureImage,
                'coordinator_signature_ip' => $identity['ip'],
                'coordinator_signature_user_agent' => $identity['user_agent'],
                'coordinator_signed_at' => now(),
            ]);

            $this->transition($locked, 'coordinator_countersigned', 'dpnda_record.coordinator_countersigned');

            // docs/2.2: "Completed/Archived | Fully executed NDA stored in repository | System (auto)"
            $locked = $this->transition($locked->fresh(), 'completed', 'dpnda_record.completed');

            // docs/2.2: Fully executed -> Trainee + Dept Coordinator + DPO (for records).
            $this->notifications->notifyUser($locked->placement->trainee, 'NDA fully executed', "NDA {$locked->tracking_number} is fully executed.", $locked);
            $this->notifications->notifyUser($locked->placement->coordinator, 'NDA fully executed', "NDA {$locked->tracking_number} is fully executed.", $locked);
            $this->notifications->notifyRole('dpo_staff', 'NDA fully executed', "NDA {$locked->tracking_number} is fully executed.", $locked);

            GenerateDpndaPdfJob::dispatch($locked->id, $locked->placement->coordinator_id);

            return $locked->fresh();
        });
    }

    private function transition(DpndaRecord $record, string $toStatus, string $eventType, ?string $comments = null): DpndaRecord
    {
        return DB::transaction(function () use ($record, $toStatus, $eventType, $comments) {
            $locked = DpndaRecord::lockForUpdate()->findOrFail($record->id);

            if (! $locked->canTransitionTo($toStatus)) {
                throw new RuntimeException("Illegal DPNDA transition: {$locked->status} -> {$toStatus}.");
            }

            $fromStatus = $locked->status;
            $locked->update(['status' => $toStatus]);

            $this->statusHistory->record($locked, $fromStatus, $toStatus, $comments);
            $this->auditLog->record($eventType, $locked, ['status' => $fromStatus], ['status' => $toStatus]);

            return $locked->fresh();
        });
    }

    private function nextTrackingNumber(): string
    {
        $year = now()->year;
        // withTrashed: soft-deleted rows still occupy their tracking number; excluding them
        // would let a new record collide with a deleted one's number.
        $count = DpndaRecord::withTrashed()->where('tracking_number', 'like', "DPNDA-{$year}-%")->lockForUpdate()->count();

        return sprintf('DPNDA-%d-%04d', $year, $count + 1);
    }
}
