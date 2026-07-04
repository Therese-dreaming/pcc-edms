import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const STATUS_LABELS = {
    draft: 'Draft',
    sent_for_signing: 'Sent for Signing',
    trainee_signed: 'Trainee Signed',
    declined: 'Declined',
    coordinator_countersigned: 'Coordinator Countersigned',
    completed: 'Completed',
};

export default function Index({ records }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">DPNDA Records (OJT/Trainee NDA)</h2>}>
            <Head title="DPNDA Records" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="mb-4 flex justify-end">
                        <Link
                            href={route('dpnda.create')}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            New NDA Record
                        </Link>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tracking #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Trainee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {records.length === 0 && (
                                    <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No NDA records yet.</td></tr>
                                )}
                                {records.map((record) => (
                                    <tr key={record.id}>
                                        <td className="px-6 py-4">
                                            <Link href={route('dpnda.show', record.id)} className="text-indigo-600 hover:underline">
                                                {record.tracking_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.placement?.trainee_first_name} {record.placement?.trainee_last_name}
                                        </td>
                                        <td className="px-6 py-4">{STATUS_LABELS[record.status] ?? record.status}</td>
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
