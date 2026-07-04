import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const STATUS_LABELS = {
    draft: 'Draft',
    submitted: 'Submitted',
    screening: 'Screening',
    returned: 'Returned',
    under_review: 'Under Review',
    endorsed: 'Endorsed',
    rejected: 'Rejected',
    approved: 'Approved',
    clearance_issued: 'Clearance Issued',
};

export default function Index({ applications }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    DPREQ Applications
                </h2>
            }
        >
            <Head title="DPREQ Applications" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="mb-4 flex justify-end">
                        <Link
                            href={route('dpreq.create')}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            New Application
                        </Link>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tracking #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Research Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                            No applications yet.
                                        </td>
                                    </tr>
                                )}
                                {applications.map((application) => (
                                    <tr key={application.id}>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={route('dpreq.show', application.id)}
                                                className="text-indigo-600 hover:underline"
                                            >
                                                {application.tracking_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            {application.research_application?.research_title}
                                        </td>
                                        <td className="px-6 py-4">
                                            {STATUS_LABELS[application.status] ?? application.status}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
