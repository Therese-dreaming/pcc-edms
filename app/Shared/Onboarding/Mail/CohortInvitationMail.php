<?php

namespace App\Shared\Onboarding\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

// The adviser manual-add fallback: a personal, single-use, expiring link for a student who can't
// self-enrol with the class code. Sent synchronously (NOT ShouldQueue): this is a mail the student
// waits on, and QUEUE_CONNECTION=database without a running worker would otherwise strand it in the
// jobs table (concern 6 / A2). A single inline SMTP send is acceptable; bulk/PDF work stays queued.
class CohortInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $memberName,
        public readonly string $cohortName,
        public readonly string $adviserName,
        public readonly string $acceptUrl,
        public readonly string $expiresAt,
    ) {
    }

    public function build(): self
    {
        return $this->subject("You've been added to {$this->cohortName} on PCC-EDMS")
            ->view('mail.cohort-invitation');
    }
}
