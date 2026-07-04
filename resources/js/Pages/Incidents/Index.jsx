import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const STATUS_LABELS = {
    reported: 'Reported',
    under_investigation: 'Under Investigation',
    corrective_action_in_progress: 'Corrective Action in Progress',
    resolved: 'Resolved',
    closed: 'Closed',
};

export default function Index({ incidents }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Incident Reports</h2>}>
            <Head title="Incident Reports" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Study</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Severity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {incidents.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No incidents reported.</td></tr>
                                )}
                                {incidents.map((incident) => (
                                    <tr key={incident.id}>
                                        <td className="px-6 py-4">
                                            <Link href={route('incidents.show', incident.id)} className="text-indigo-600 hover:underline">
                                                {incident.remis_application?.tracking_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">{incident.incident_type}</td>
                                        <td className="px-6 py-4">{incident.severity}</td>
                                        <td className="px-6 py-4">{STATUS_LABELS[incident.status] ?? incident.status}</td>
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
