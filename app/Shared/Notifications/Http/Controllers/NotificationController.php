<?php

namespace App\Shared\Notifications\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Notifications\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

// docs/4.3-esignature-notifications.md — in-app notification bell + full history page. Every
// module already writes real `notifications` rows via NotificationService; this is the first
// UI that ever surfaces them to the user they were sent to.
class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->string('filter')->toString() === 'unread' ? 'unread' : 'all';

        $base = Notification::query()->where('user_id', $request->user()->id);
        $unreadCount = (clone $base)->whereNull('read_at')->count();

        $notifications = (clone $base)
            ->when($filter === 'unread', fn ($q) => $q->whereNull('read_at'))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        // Deliberately not named `notifications` — HandleInertiaRequests already shares a
        // `notifications` prop (bell badge count + recent list) on every request, and Inertia
        // resolves a page-prop/shared-prop key collision in favor of the page prop, which would
        // silently break the bell on this specific page.
        return Inertia::render('Notifications/Index', [
            'notificationHistory' => $notifications,
            'filter' => $filter,
            'unreadCount' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, Notification $notification): RedirectResponse
    {
        $this->authorize('markAsRead', $notification);

        if ($notification->read_at === null) {
            $notification->markAsRead();
        }

        return back();
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back();
    }
}
