import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function ReviewerWorkload({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        risk_track: filters.risk_track ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.reviewer-workload'), form, { preserveState: true });
    };

    const sorted = [...data.rows].sort((a, b) => (b.active + b.completed) - (a.active + a.completed));

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Reviewer Workload</h2>}
        >
            <Head title="Reviewer Workload" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.reviewer-workload') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Assigned From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Assigned To</label>
                            <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Risk Track</label>
                            <select value={form.risk_track} onChange={(e) => setForm({ ...form, risk_track: e.target.value })} className="rounded-md border-gray-300 text-sm">
                                <option value="">Any</option>
                                <option value="expedited">Expedited</option>
                                <option value="committee">Committee</option>
                                <option value="full_board">Full Board</option>
                            </select>
                        </div>
                        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Apply
                        </button>
                    </form>

                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Reviewer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Active</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Completed</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Avg Turnaround</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {sorted.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No review assignments for the selected filters.</td></tr>
                                )}
                                {sorted.map((row) => (
                                    <tr key={row.reviewer}>
                                        <td className="px-6 py-4 font-medium text-gray-800">{row.reviewer}</td>
                                        <td className="px-6 py-4">{row.active}</td>
                                        <td className="px-6 py-4">{row.completed}</td>
                                        <td className="px-6 py-4">{row.avg_turnaround_days !== null ? `${row.avg_turnaround_days} days` : 'n/a'}</td>
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
