import Dropdown from '@/Components/Dropdown';
import { Link, router, usePage } from '@inertiajs/react';

// docs/4.3-esignature-notifications.md — in-app notification bell. Data comes from the
// `notifications` Inertia shared prop (HandleInertiaRequests), refreshed on every page visit —
// no separate polling endpoint, this app has no websocket infra.
export default function NotificationBell() {
    const { notifications } = usePage().props;

    if (!notifications) {
        return null;
    }

    const { unread_count: unreadCount, recent } = notifications;

    const openNotification = (notification) => {
        if (notification.read_at === null) {
            router.post(route('notifications.read', notification.id), {}, {
                preserveScroll: true,
                onFinish: () => {
                    if (notification.related_url) {
                        router.visit(notification.related_url);
                    }
                },
            });
        } else if (notification.related_url) {
            router.visit(notification.related_url);
        }
    };

    return (
        <Dropdown align="right" width="80">
            <Dropdown.Trigger>
                <button
                    type="button"
                    className="relative inline-flex items-center rounded-md border border-transparent p-2 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </Dropdown.Trigger>

            <Dropdown.Content contentClasses="py-0 bg-white" width="80">
                <div className="w-80">
                    <div className="flex items-center justify-between border-b px-4 py-2">
                        <span className="text-sm font-semibold text-gray-700">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => router.post(route('notifications.read-all'), {}, { preserveScroll: true })}
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {recent.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet.</p>
                        )}
                        {recent.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                onClick={() => openNotification(n)}
                                className={`block w-full border-b px-4 py-3 text-left text-sm hover:bg-gray-50 ${n.read_at === null ? 'bg-indigo-50' : ''}`}
                            >
                                <div className="font-semibold text-gray-800">{n.subject}</div>
                                <div className="mt-0.5 line-clamp-2 text-gray-600">{n.body}</div>
                                <div className="mt-1 text-xs text-gray-400">{n.created_at}</div>
                            </button>
                        ))}
                    </div>

                    <Link
                        href={route('notifications.index')}
                        className="block border-t px-4 py-2 text-center text-sm text-indigo-600 hover:bg-gray-50 hover:underline"
                    >
                        View all
                    </Link>
                </div>
            </Dropdown.Content>
        </Dropdown>
    );
}
