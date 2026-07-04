<?php

namespace App\Shared\Notifications\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

// docs/4.3-esignature-notifications.md "Notification Channels": "Email (required, mirrors
// in-app)". Queued for the same reason PDF generation is (docs/system-design.md §5) — sending
// mail is a slow external call that shouldn't block the request that triggered the notification.
class NotificationMail extends Mailable implements ShouldQueue
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
