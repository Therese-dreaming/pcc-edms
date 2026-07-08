import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import { Head, router } from '@inertiajs/react';
import { IconBell, IconChecks } from '@tabler/icons-react';

export default function Index({ notificationHistory }) {
    const open = (notification) => {
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
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconBell}
                    title="Notifications"
                    description="Updates on your submissions and pending actions."
                    actions={
                        <button
                            type="button"
                            onClick={() => router.post(route('notifications.read-all'))}
                            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
                        >
                            <IconChecks size={16} strokeWidth={2} />
                            Mark all read
                        </button>
                    }
                />
            }
        >
            <Head title="Notifications" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                        <ul className="divide-y divide-zinc-200">
                            {notificationHistory.data.length === 0 && (
                                <li className="px-6 py-8 text-center text-zinc-500">No notifications yet.</li>
                            )}
                            {notificationHistory.data.map((n) => (
                                <li key={n.id}>
                                    <button
                                        type="button"
                                        onClick={() => open(n)}
                                        className={`block w-full px-6 py-4 text-left hover:bg-zinc-50 transition-colors ${n.read_at === null ? 'bg-primary-50' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-zinc-800">{n.subject}</span>
                                            <span className="text-xs text-zinc-400">{n.created_at}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-zinc-600">{n.body}</p>
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
