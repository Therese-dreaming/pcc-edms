<?php

namespace App\Shared\Notifications\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

// docs/4.3-esignature-notifications.md "Notification Channels": "Email (required, mirrors
// in-app)". Deliberately NOT `ShouldQueue`: the dispatch choice (queue vs. inline send) belongs
// to the caller — see NotificationService. `notifyUser()` queues it (slow external call kept off
// the request, docs/system-design.md §5); `notifyUserSync()` sends it inline for mails a user
// actively waits on where a missing queue worker must not strand the delivery (concern 6 / A2,
// same reasoning as ResearchTeamNdaInvitationMail).
class NotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $notificationSubject,
        public readonly string $notificationBody,
        public readonly ?string $actionUrl = null,
    ) {
    }

    public function build(): self
    {
        return $this->subject($this->notificationSubject)
            ->view('mail.notification');
    }
}
