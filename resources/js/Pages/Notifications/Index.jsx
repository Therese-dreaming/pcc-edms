import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

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
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Notifications</h2>}
        >
            <Head title="Notifications" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="mb-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => router.post(route('notifications.read-all'))}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Mark all read
                        </button>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <ul className="divide-y divide-gray-200">
                            {notificationHistory.data.length === 0 && (
                                <li className="px-6 py-8 text-center text-gray-500">No notifications yet.</li>
                            )}
                            {notificationHistory.data.map((n) => (
                                <li key={n.id}>
                                    <button
                                        type="button"
                                        onClick={() => open(n)}
                                        className={`block w-full px-6 py-4 text-left hover:bg-gray-50 ${n.read_at === null ? 'bg-indigo-50' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-800">{n.subject}</span>
                                            <span className="text-xs text-gray-400">{n.created_at}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">{n.body}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {notificationHistory.links.length > 3 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-1">
                            {notificationHistory.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded-md px-3 py-1 text-sm ${
                                        link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300'
                                    } ${!link.url ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
