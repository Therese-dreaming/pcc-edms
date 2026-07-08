import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, Link } from '@inertiajs/react';
import { IconChartBar } from '@tabler/icons-react';

export default function Index({ reports }) {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconChartBar}
                    title="Reports"
                    description="Compliance and workload reports available to your role."
                />
            }
        >
            <Head title="Reports" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                        <ul className="divide-y divide-zinc-200">
                            {reports.length === 0 && (
                                <li className="px-6 py-4 text-zinc-500">
                                    No reports available for your role.
                                </li>
                            )}
                            {reports.map((report) => (
                                <li key={report.route}>
                                    <Link
                                        href={route(report.route)}
                                        className="block px-6 py-4 text-primary-700 hover:bg-zinc-50 hover:underline transition-colors"
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
