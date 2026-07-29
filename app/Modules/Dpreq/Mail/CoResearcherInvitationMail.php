<?php

namespace App\Modules\Dpreq\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

// Sent to each named co-researcher the moment a DPREQ application is submitted, so they know they
// were added to the research team. It carries NO signing link — under concern 7 (B1) the Research
// Team NDA isn't created and signing doesn't open until the DPO approves; that single-use signing
// link arrives later in ResearchTeamNdaInvitationMail. Sent synchronously (not ShouldQueue) since
// QUEUE_CONNECTION=database has no running worker (A2).
class CoResearcherInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $memberName,
        public readonly string $researchTitle,
        public readonly string $leadName,
        public readonly string $trackingNumber,
    ) {
    }

    public function build(): self
    {
        return $this->subject("You've been added to a research team — \"{$this->researchTitle}\"")
            ->view('mail.co-researcher-invitation');
    }
}
