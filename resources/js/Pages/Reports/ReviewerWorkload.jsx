import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { IconUsers } from '@tabler/icons-react';
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
            header={
                <PageHeader
                    icon={IconUsers}
                    title="Reviewer Workload"
                    description="Active and completed review assignments per reviewer, with average turnaround."
                />
            }
        >
            <Head title="Reviewer Workload" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.reviewer-workload') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Assigned From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Assigned To</label>
                            <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Risk Track</label>
                            <select value={form.risk_track} onChange={(e) => setForm({ ...form, risk_track: e.target.value })} className="rounded-md border-zinc-300 text-sm">
                                <option value="">Any</option>
                                <option value="expedited">Expedited</option>
                                <option value="committee">Committee</option>
                                <option value="full_board">Full Board</option>
                            </select>
                        </div>
                        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                            Apply
                        </button>
                    </form>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Reviewer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Active</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Completed</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Avg Turnaround</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white">
                                {sorted.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-zinc-500">No review assignments for the selected filters.</td></tr>
                                )}
                                {sorted.map((row) => (
                                    <tr key={row.reviewer}>
                                        <td className="px-6 py-4 font-medium text-zinc-800">{row.reviewer}</td>
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
