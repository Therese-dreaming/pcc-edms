<?php

namespace App\Modules\Dpreq\Mail;

use App\Modules\Dpreq\Models\ResearchTeamNdaSignatory;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

// stakeholder-additional-features.md (2026-07-25), "Individual Member Electronic Signature
// Workflow" — the unique, per-member signing link is delivered by email. Sent synchronously
// (NOT ShouldQueue): this is a mail a user actively waits on, and QUEUE_CONNECTION=database without
// a running worker would otherwise strand it in the jobs table (concern 6 / A2). A single inline
// SMTP send is acceptable; bulk/PDF work stays queued.
class ResearchTeamNdaInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $memberName,
        public readonly string $researchTitle,
        public readonly string $trackingNumber,
        public readonly string $signingUrl,
        public readonly string $expiresAt,
    ) {
    }

    public function build(): self
    {
        return $this->subject("Action needed: sign the Research Team NDA for \"{$this->researchTitle}\"")
            ->view('mail.nda-invitation');
    }
}
