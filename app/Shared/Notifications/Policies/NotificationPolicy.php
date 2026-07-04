<?php

namespace App\Shared\Notifications\Policies;

use App\Models\User;
use App\Shared\Notifications\Models\Notification;

// docs/4.3-esignature-notifications.md — a notification is only ever visible to the user it
// was sent to; there's no "staff can see anyone's notifications" case anywhere in the FRS.
class NotificationPolicy
{
    public function markAsRead(User $user, Notification $notification): bool
    {
        return $notification->user_id === $user->id;
    }
}
