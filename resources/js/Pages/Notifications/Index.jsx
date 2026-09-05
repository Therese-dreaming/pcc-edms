import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import { relativeTime, formatDateTime } from '@/lib/datetime';
import { Head, router } from '@inertiajs/react';
import { IconChecks } from '@tabler/icons-react';

export default function Index({ notificationHistory, filter = 'all', unreadCount = 0 }) {
    const open = (notification) => {
        if (notification.read_at === null) {
            router.post(route('notifications.read', notification.id), {}, {
                preserveScroll: true,
                onFinish: () => { if (notification.related_url) router.visit(notification.related_url); },
            });
        } else if (notification.related_url) {
            router.visit(notification.related_url);
        }
    };

    const setFilter = (value) =>
        router.get(route('notifications.index'), value === 'all' ? {} : { filter: value }, { preserveScroll: true, preserveState: true, replace: true });

    return (
        <AuthenticatedLayout>
            <Head title="Notifications" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
                        <div className="min-w-0">
                            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Workspace</p>
                            <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Notifications</h1>
                            <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Updates on your submissions and pending actions.</p>
                        </div>
                        {unreadCount > 0 ? (
                            <button
                                type="button"
                                onClick={() => router.post(route('notifications.read-all'), {}, { preserveScroll: true })}
                                className="inline-flex items-center gap-2 rounded-full border border-border-medium bg-surface-secondary px-4 py-2 text-sm font-semibold text-fg-secondary transition-colors hover:bg-surface-tertiary"
                            >
                                <IconChecks size={16} strokeWidth={2} />
                                Mark all read
                            </button>
                        ) : null}
                    </div>
                    {/* Tabs */}
                    <div className="mb-4 inline-flex items-center gap-1 rounded-full border border-border bg-surface-secondary p-1">
                        {[['all', 'All'], ['unread', `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`]].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setFilter(key)}
                                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                                    filter === key ? 'bg-primary text-white' : 'text-fg-secondary hover:bg-surface-tertiary'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border bg-surface-secondary shadow-resting">
                        <ul className="divide-y divide-border">
                            {notificationHistory.data.length === 0 && (
                                <li className="px-6 py-12 text-center text-sm text-fg-tertiary">
                                    {filter === 'unread' ? "You're all caught up — no unread notifications." : 'No notifications yet.'}
                                </li>
                            )}
                            {notificationHistory.data.map((n) => (
                                <li key={n.id}>
                                    <button
                                        type="button"
                                        onClick={() => open(n)}
                                        className={`flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-surface-tertiary ${n.read_at === null ? 'bg-primary-soft/50' : ''}`}
                                    >
                                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at === null ? 'bg-primary' : 'bg-border-medium'}`} aria-hidden="true" />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center justify-between gap-3">
                                                <span className="truncate font-semibold text-fg-primary">{n.subject}</span>
                                                <span className="shrink-0 text-xs text-fg-tertiary" title={formatDateTime(n.created_at)}>
                                                    {relativeTime(n.created_at)}
                                                </span>
                                            </span>
                                            <span className="mt-1 block text-sm text-fg-secondary">{n.body}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-4">
                        <Pagination paginator={notificationHistory} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
