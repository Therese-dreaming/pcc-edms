import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import BarList from '@/Components/Reports/BarList';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';

export default function IncidentSummary({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
        incident_type: filters.incident_type ?? '',
        severity: filters.severity ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.incident-summary'), form, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconAlertTriangle}
                    title="Incident Summary"
                    description="Reported incidents broken down by type, severity, and resolution status."
                />
            }
        >
            <Head title="Incident Summary" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.incident-summary') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">To</label>
                            <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Department</label>
                            <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                            Apply
                        </button>
                    </form>

                    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-zinc-700">By Type</h3>
                            <BarList counts={data.by_type} />
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-zinc-700">By Severity</h3>
                            <BarList counts={data.by_severity} />
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-zinc-700">By Status</h3>
                            <BarList counts={data.by_status} />
                        </div>
                    </div>

                    <p className="mb-4 text-sm text-zinc-600">
                        Total: {data.total} incidents. Average time-to-resolution:{' '}
                        {data.avg_resolution_days !== null ? `${data.avg_resolution_days} days` : 'n/a'}
                    </p>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Tracking #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Severity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white">
                                {data.incidents.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-zinc-500">No incidents for the selected filters.</td></tr>
                                )}
                                {data.incidents.map((incident) => (
                                    <tr key={incident.id}>
                                        <td className="px-6 py-4">{incident.tracking_number}</td>
                                        <td className="px-6 py-4">{incident.department}</td>
                                        <td className="px-6 py-4">{incident.incident_type}</td>
                                        <td className="px-6 py-4">{incident.severity}</td>
                                        <td className="px-6 py-4">{incident.status}</td>
                                        <td className="px-6 py-4">{incident.incident_date}</td>
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
