<?php

namespace App\Http\Middleware;

use App\Shared\Notifications\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user()?->load('role');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'roleName' => $user?->role?->name,
            ],
            // docs/4.3 — notification bell. Shared on every request (not fetched separately)
            // since this app has no websocket/polling infra; a full Inertia page visit already
            // refreshes it on every navigation, which is enough for an MVP in-app bell.
            'notifications' => $user ? [
                'unread_count' => Notification::where('user_id', $user->id)->whereNull('read_at')->count(),
                'recent' => Notification::where('user_id', $user->id)->latest()->limit(8)->get(),
            ] : null,
        ];
    }
}
