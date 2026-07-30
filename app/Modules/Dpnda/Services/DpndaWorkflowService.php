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
        if (! $record->canTransitionTo('trainee_signed')) {
            throw new RuntimeException("Illegal DPNDA transition: {$record->status} -> trainee_signed.");
        }

        $identity = SignatureIdentity::capture();

        $record->update([
            'trainee_signature_id' => $typedFullName,
            'trainee_signature_image' => $signatureImage,
            'trainee_signature_ip' => $identity['ip'],
            'trainee_signature_user_agent' => $identity['user_agent'],
            'trainee_signed_at' => now(),
        ]);

        $record = $this->transition($record, 'trainee_signed', 'dpnda_record.trainee_signed');

        // docs/2.2: Trainee signed -> Dept Coordinator.
        $this->notifications->notifyUser($record->placement->coordinator, 'Trainee signed NDA', "{$record->placement->traineeFullName()} signed NDA {$record->tracking_number} — countersignature needed.", $record);

        return $record;
    }

    public function decline(DpndaRecord $record, string $reason): DpndaRecord
    {
        $record->update(['decline_reason' => $reason]);

        $record = $this->transition($record, 'declined', 'dpnda_record.declined', $reason);

        // docs/2.2: Declined -> Dept Coordinator + DPO.
        $this->notifications->notifyUser($record->placement->coordinator, 'NDA declined', "{$record->placement->traineeFullName()} declined NDA {$record->tracking_number}: \"{$reason}\"", $record);
        $this->notifications->notifyRole('dpo_staff', 'NDA declined', "NDA {$record->tracking_number} was declined by the trainee: \"{$reason}\"", $record);

        return $record;
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
        $count = DpndaRecord::where('tracking_number', 'like', "DPNDA-{$year}-%")->lockForUpdate()->count();

        return sprintf('DPNDA-%d-%04d', $year, $count + 1);
    }
}
