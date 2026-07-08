<?php

namespace App\Shared\Auth\Listeners;

use Illuminate\Auth\Events\Verified;

// docs/4.1-user-roles-permissions.md "Validation Flow" — pending_validation exists only to
// gate un-verified self-registrations, not as a separate manual-approval step. Once the user
// proves they own the email address, the account activates itself; only suspended/deactivated
// still require an admin action. Admin-created accounts that were deliberately left suspended
// or deactivated are untouched — this only ever moves *out of* pending_validation.
class ActivateUserOnEmailVerification
{
    public function handle(Verified $event): void
    {
        $user = $event->user;

        if ($user->account_status === 'pending_validation') {
            $user->update(['account_status' => 'active']);
        }
    }
}
