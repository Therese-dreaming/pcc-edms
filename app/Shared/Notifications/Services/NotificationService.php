<?php

namespace App\Shared\Notifications\Services;

use App\Models\User;
use App\Shared\Notifications\Mail\NotificationMail;
use App\Shared\Notifications\Models\Notification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Mail;

// docs/4.3-esignature-notifications.md — in-app + email notification dispatch. Modules call this
// instead of writing to the notifications table directly, matching the DocumentService/
// AuditLogService pattern used everywhere else.
//
// docs/4.3 "Notification Channels": "Email (required, mirrors in-app)". Every notification
// created here also dispatches a `NotificationMail` — queued by default (notifyUser), or inline
// for user-waited-on mails (notifyUserSync). See EMAIL_SETUP.md for configuring a real
// SMTP/Mailgun/SES mailer; with the Laravel-default `MAIL_MAILER=log`, mail is written to
// storage/logs/laravel.log instead of actually sending, so this is always safe to leave on. SMS
// (the third channel docs/4.3 lists) is explicitly out of scope — the doc itself marks it
// optional ("confirm if needed for time-sensitive DPO whereabouts alerts").
class NotificationService
{
    public function notifyUser(User $user, string $subject, string $body, ?Model $related = null): Notification
    {
        return $this->createNotification($user, $subject, $body, $related, sync: false);
    }

    /**
     * Same as notifyUser(), but the mirrored email is sent inline (synchronously) instead of
     * being queued. Use for mails a user actively waits on — e.g. "your NDA is ready to sign" —
     * where a missing queue worker (QUEUE_CONNECTION=database with no `queue:work` running) must
     * not strand the delivery (concern 6 / A2, same reasoning as ResearchTeamNdaInvitationMail).
     */
    public function notifyUserSync(User $user, string $subject, string $body, ?Model $related = null): Notification
    {
        return $this->createNotification($user, $subject, $body, $related, sync: true);
    }

    private function createNotification(User $user, string $subject, string $body, ?Model $related, bool $sync): Notification
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'channel' => 'in_app',
            'subject' => $subject,
            'body' => $body,
            'related_type' => $related?->getMorphClass(),
            'related_id' => $related?->getKey(),
        ]);

        $this->sendEmail($user, $notification, $sync);

        return $notification;
    }

    /**
     * Notify every active user holding the given role.
     */
    public function notifyRole(string $roleName, string $subject, string $body, ?Model $related = null): void
    {
        $users = User::whereHas('role', fn ($q) => $q->where('name', $roleName))
            ->where('account_status', 'active')
            ->get();

        foreach ($users as $user) {
            $this->notifyUser($user, $subject, $body, $related);
        }
    }

    private function sendEmail(User $user, Notification $notification, bool $sync = false): void
    {
        if (! $user->email) {
            return;
        }

        $actionUrl = $notification->related_url ? url($notification->related_url) : null;

        $mail = new NotificationMail($notification->subject, $notification->body, $actionUrl);

        $sync
            ? Mail::to($user->email)->send($mail)
            : Mail::to($user->email)->queue($mail);
    }
}
