<?php

namespace App\Modules\Remis\Incident\Services;

use App\Modules\Remis\Incident\Models\Incident;
use App\Modules\Remis\Models\RemisApplication;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\AuditLog\Services\StatusHistoryService;
use App\Shared\Notifications\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use RuntimeException;

// docs/3.5-remis-incident-reporting.md — filing, tracking, and corrective-action monitoring,
// independent of the study's normal status lifecycle (docs/3.3). The single most important
// behavior here: filing a Data Breach or Confidentiality Breach incident notifies DPO Staff
// directly (docs/knowledge-graph.md's "entity.incident --NOTIFIES--> role.dpo_staff" edge) —
// this is the concrete DPO<->REMIS integration point the whole REMIS realignment pass was
// built around, so it's covered by an explicit positive AND negative test
// (docs/testing-strategy.md).
class IncidentService
{
    public function __construct(
        private readonly StatusHistoryService $statusHistory,
        private readonly AuditLogService $auditLog,
        private readonly NotificationService $notifications,
    ) {
    }

    public function file(RemisApplication $application, array $data, int $reporterId): Incident
    {
        return DB::transaction(function () use ($application, $data, $reporterId) {
            $incident = Incident::create([
                'remis_application_id' => $application->id,
                'incident_type' => $data['incident_type'],
                'severity' => $data['severity'],
                'incident_date' => $data['incident_date'],
                'reported_by' => $reporterId,
                'description' => $data['description'],
                'immediate_actions' => $data['immediate_actions'] ?? null,
                'status' => 'reported',
            ]);

            $this->statusHistory->record($incident, null, 'reported');
            $this->auditLog->record('incident.filed', $incident, null, $incident->toArray());

            $subject = "Incident reported: {$application->tracking_number}";
            $body = "A {$incident->incident_type} incident (severity: {$incident->severity}) was reported for {$application->tracking_number}.";

            $this->notifications->notifyRole('ethics_committee_chair', $subject, $body, $incident);
            $this->notifications->notifyRole('ethics_secretariat', $subject, $body, $incident);

            // Auto-pause monitoring for data breach/confidentiality breach incidents
            if ($incident->notifiesDpo()) {
                $this->autoPauseMonitoring($application);
            }

            if ($incident->notifiesDpo()) {
                $this->notifications->notifyRole(
                    'dpo_staff',
                    "DPO-relevant incident: {$application->tracking_number}",
                    "A {$incident->incident_type} incident was reported for REMIS study {$application->tracking_number}. This may be a Data Privacy Act matter — see docs/3.5.",
                    $incident,
                );
                $this->auditLog->record('incident.dpo_notified', $incident, null, ['incident_type' => $incident->incident_type]);
            }

            return $incident;
        });
    }

    public function assign(Incident $incident, int $assigneeId): Incident
    {
        $incident->update(['assigned_to' => $assigneeId]);
        $this->auditLog->record('incident.assigned', $incident, null, ['assigned_to' => $assigneeId]);

        return $incident->fresh();
    }

    public function addInvestigationNote(Incident $incident, string $authorName, string $note): Incident
    {
        $entry = sprintf('[%s — %s] %s', now()->toDateTimeString(), $authorName, $note);
        $incident->update([
            'investigation_notes' => trim(($incident->investigation_notes ?? '')."\n{$entry}"),
        ]);

        return $incident->fresh();
    }

    public function transition(Incident $incident, string $toStatus): Incident
    {
        return DB::transaction(function () use ($incident, $toStatus) {
            $locked = Incident::lockForUpdate()->findOrFail($incident->id);

            if (! $locked->canTransitionTo($toStatus)) {
                throw new RuntimeException("Illegal incident transition: {$locked->status} -> {$toStatus}.");
            }

            $fromStatus = $locked->status;
            $locked->update(['status' => $toStatus]);

            $this->statusHistory->record($locked, $fromStatus, $toStatus);
            $this->auditLog->record('incident.status_changed', $locked, ['status' => $fromStatus], ['status' => $toStatus]);

            return $locked->fresh();
        });
    }

    public function setCorrectiveAction(Incident $incident, string $required, string $dueDate): Incident
    {
        $incident->update([
            'corrective_action_required' => $required,
            'corrective_action_due_date' => $dueDate,
            'corrective_action_status' => 'in_progress',
        ]);

        $this->auditLog->record('incident.corrective_action_set', $incident, null, [
            'corrective_action_required' => $required,
            'corrective_action_due_date' => $dueDate,
        ]);

        return $incident->fresh();
    }

    public function completeCorrectiveAction(Incident $incident): Incident
    {
        $incident->update(['corrective_action_status' => 'completed']);
        $this->auditLog->record('incident.corrective_action_completed', $incident);

        return $incident->fresh();
    }

    public function verifyCorrectiveAction(Incident $incident, int $verifierId): Incident
    {
        if ($incident->corrective_action_status !== 'completed') {
            throw new RuntimeException('Corrective action must be marked completed before it can be verified.');
        }

        $incident->update([
            'corrective_action_status' => 'verified',
            'verified_by' => $verifierId,
            'verified_at' => now(),
        ]);

        $this->auditLog->record('incident.corrective_action_verified', $incident, null, ['verified_by' => $verifierId]);

        return $incident->fresh();
    }

    /**
     * Auto-pause monitoring when a data breach is reported.
     * Changes status from 'monitoring' to 'monitoring_paused' and records in audit log.
     * ('monitoring_paused' is the legal status per RemisApplication::LEGAL_TRANSITIONS and the
     * value RemisWorkflowService::resumeMonitoring() transitions back from.)
     */
    private function autoPauseMonitoring(RemisApplication $application): void
    {
        if ($application->status !== 'monitoring') {
            return;
        }

        $fromStatus = $application->status;
        $application->update(['status' => 'monitoring_paused']);

        $this->statusHistory->record($application, $fromStatus, 'monitoring_paused');
        $this->auditLog->record(
            'remis_application.paused_for_incident',
            $application,
            ['status' => $fromStatus],
            ['status' => 'monitoring_paused']
        );
    }
}
