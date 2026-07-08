import Dropdown from '@/Components/Dropdown';
import { IconBell } from '@tabler/icons-react';
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
                    title="Notifications"
                    aria-label="Notifications"
                    className="relative inline-flex items-center rounded-md border border-transparent p-2 text-zinc-500 transition-colors duration-150 ease-in-out hover:text-zinc-700"
                >
                    <IconBell size={22} stroke={1.75} aria-hidden="true" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </Dropdown.Trigger>

            <Dropdown.Content contentClasses="py-0 bg-white" width="80">
                <div className="w-80">
                    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
                        <span className="text-sm font-semibold text-zinc-700">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => router.post(route('notifications.read-all'), {}, { preserveScroll: true })}
                                className="text-xs text-primary-700 hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {recent.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-zinc-500">No notifications yet.</p>
                        )}
                        {recent.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                onClick={() => openNotification(n)}
                                className={`block w-full border-b border-zinc-100 px-4 py-3 text-left text-sm hover:bg-zinc-50 ${n.read_at === null ? 'bg-primary-50' : ''}`}
                            >
                                <div className="font-semibold text-zinc-800">{n.subject}</div>
                                <div className="mt-0.5 line-clamp-2 text-zinc-600">{n.body}</div>
                                <div className="mt-1 text-xs text-zinc-400">{n.created_at}</div>
                            </button>
                        ))}
                    </div>

                    <Link
                        href={route('notifications.index')}
                        className="block border-t border-zinc-200 px-4 py-2 text-center text-sm text-primary-700 hover:bg-zinc-50 hover:underline"
                    >
                        View all
                    </Link>
                </div>
            </Dropdown.Content>
        </Dropdown>
    );
}
