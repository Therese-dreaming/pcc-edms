import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, Link, router } from '@inertiajs/react';
import { IconClockHour4 } from '@tabler/icons-react';
import { useState } from 'react';

const STATUS_LABELS = {
    submitted: 'Submitted',
    screening: 'Screening',
    returned: 'Returned',
    under_review: 'Under Review',
    endorsed: 'Endorsed',
};

export default function PendingApprovals({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.pending-dpo-approvals'), form, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconClockHour4}
                    title="Pending DPO Approvals"
                    description="DPREQ applications still awaiting a decision, with days pending per submission."
                />
            }
        >
            <Head title="Pending DPO Approvals" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.pending-dpo-approvals') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Submitted From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Submitted To</label>
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

                    <p className="mb-4 text-sm text-zinc-600">{data.total} applications pending.</p>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Tracking #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Applicant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Submitted</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Comments</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Days Pending</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={7} className="px-6 py-4 text-center text-zinc-500">No pending approvals for the selected filters.</td></tr>
                                )}
                                {data.rows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-6 py-4">
                                            <Link href={route('dpreq.show', row.id)} className="text-primary-700 hover:underline">
                                                {row.tracking_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">{row.applicant}</td>
                                        <td className="px-6 py-4">{row.department}</td>
                                        <td className="px-6 py-4">{row.submitted_at}</td>
                                        <td className="px-6 py-4">{STATUS_LABELS[row.status] ?? row.status}</td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={row.comments ?? ''}>{row.comments ?? '—'}</td>
                                        <td className="px-6 py-4">{row.days_pending}</td>
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
