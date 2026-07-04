import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ reports }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Reports</h2>}
        >
            <Head title="Reports" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <ul className="divide-y divide-gray-200">
                            {reports.length === 0 && (
                                <li className="px-6 py-4 text-gray-500">
                                    No reports available for your role.
                                </li>
                            )}
                            {reports.map((report) => (
                                <li key={report.route}>
                                    <Link
                                        href={route(report.route)}
                                        className="block px-6 py-4 text-indigo-600 hover:bg-gray-50 hover:underline"
                                    >
                                        {report.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
