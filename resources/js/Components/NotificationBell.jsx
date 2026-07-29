import { relativeTime, formatDateTime } from '@/lib/datetime';
import { IconBell, IconChecks } from '@tabler/icons-react';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// docs/4.3-esignature-notifications.md — in-app notification bell. Data comes from the
// `notifications` Inertia shared prop (HandleInertiaRequests), refreshed on every page visit and
// polled every 30s. Redesign system (.claude/skills/redesign): rounded soft-shadow panel, pill
// tabs, dark-red accent for the unread badge/dot only, neutral surfaces, Inter.
export default function NotificationBell() {
    const { notifications } = usePage().props;
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('all');
    const ref = useRef(null);
    const pollRef = useRef(null);

    useEffect(() => {
        pollRef.current = setInterval(() => {
            router.reload({ only: ['notifications'], preserveScroll: true, preserveState: true });
        }, 30000);
        return () => clearInterval(pollRef.current);
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
    }, [open]);

    if (!notifications) return null;

    const { unread_count: unreadCount, recent } = notifications;
    const list = tab === 'unread' ? recent.filter((n) => n.read_at === null) : recent;

    const openNotification = (notification) => {
        setOpen(false);
        if (notification.read_at === null) {
            router.post(route('notifications.read', notification.id), {}, {
                preserveScroll: true,
                onFinish: () => { if (notification.related_url) router.visit(notification.related_url); },
            });
        } else if (notification.related_url) {
            router.visit(notification.related_url);
        }
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title="Notifications"
                aria-label="Notifications"
                className="relative grid h-10 w-10 place-items-center rounded-full text-fg-secondary transition-colors hover:bg-surface-tertiary"
            >
                <IconBell size={21} stroke={1.75} aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-40 mt-2 w-[22rem] overflow-hidden rounded-xl border border-border bg-surface-secondary shadow-hover">
                    {/* Header + tabs */}
                    <div className="border-b border-border px-4 pt-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-fg-primary">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => router.post(route('notifications.read-all'), {}, { preserveScroll: true })}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-fg-primary-strong hover:underline"
                                >
                                    <IconChecks size={14} /> Mark all read
                                </button>
                            )}
                        </div>
                        <div className="mt-2 flex gap-1">
                            {[['all', 'All'], ['unread', `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`]].map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTab(key)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        tab === key ? 'bg-primary text-white' : 'text-fg-secondary hover:bg-surface-tertiary'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto">
                        {list.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-fg-tertiary">
                                {tab === 'unread' ? "You're all caught up." : 'No notifications yet.'}
                            </p>
                        ) : (
                            list.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => openNotification(n)}
                                    className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 transition-colors hover:bg-surface-tertiary ${n.read_at === null ? 'bg-primary-soft/50' : ''}`}
                                >
                                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at === null ? 'bg-primary' : 'bg-transparent'}`} aria-hidden="true" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-fg-primary">{n.subject}</span>
                                        <span className="mt-0.5 block line-clamp-2 text-sm text-fg-secondary">{n.body}</span>
                                        <span className="mt-1 block text-xs text-fg-tertiary" title={formatDateTime(n.created_at)}>{relativeTime(n.created_at)}</span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    <Link
                        href={route('notifications.index')}
                        onClick={() => setOpen(false)}
                        className="block border-t border-border px-4 py-2.5 text-center text-sm font-semibold text-fg-primary-strong hover:bg-surface-tertiary"
                    >
                        View all notifications
                    </Link>
                </div>
            )}
        </div>
    );
}
