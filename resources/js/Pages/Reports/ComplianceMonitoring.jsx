import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import BarList from '@/Components/Reports/BarList';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { IconShieldCheck } from '@tabler/icons-react';
import { useState } from 'react';

const COMPLIANCE_LABELS = {
    compliant: 'Compliant',
    minor_issues: 'Minor Issues',
    major_issues: 'Major Issues',
    non_compliant: 'Non-Compliant',
};

export default function ComplianceMonitoring({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
        compliance_status: filters.compliance_status ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.compliance-monitoring'), form, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconShieldCheck}
                    title="Compliance Monitoring Report"
                    description="REMIS monitoring compliance status of reviewed progress reports."
                />
            }
        >
            <Head title="Compliance Monitoring Report" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.compliance-monitoring') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <p className="mb-4 rounded-lg bg-warning-bg p-3 text-sm text-warning-text">
                        This reads REMIS monitoring compliance statuses only (docs/3.4) — DPO has no
                        compliance-declaration data model yet, so this report does not cover the DPREQ track.
                    </p>

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Reviewed From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Reviewed To</label>
                            <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Department</label>
                            <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Compliance Status</label>
                            <select value={form.compliance_status} onChange={(e) => setForm({ ...form, compliance_status: e.target.value })} className="rounded-md border-zinc-300 text-sm">
                                <option value="">Any</option>
                                <option value="compliant">Compliant</option>
                                <option value="minor_issues">Minor Issues</option>
                                <option value="major_issues">Major Issues</option>
                                <option value="non_compliant">Non-Compliant</option>
                            </select>
                        </div>
                        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                            Apply
                        </button>
                    </form>

                    <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold text-zinc-700">By compliance status ({data.total} total)</h3>
                        <BarList counts={data.by_status} labels={COMPLIANCE_LABELS} />
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Tracking #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Status of Study</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Compliance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Notes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Reviewed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-zinc-500">No reviewed progress reports for the selected filters.</td></tr>
                                )}
                                {data.rows.map((row, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4">{row.tracking_number}</td>
                                        <td className="px-6 py-4">{row.department}</td>
                                        <td className="px-6 py-4">{row.status_of_study}</td>
                                        <td className="px-6 py-4">{COMPLIANCE_LABELS[row.compliance_status] ?? row.compliance_status}</td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={row.review_notes ?? ''}>{row.review_notes ?? '—'}</td>
                                        <td className="px-6 py-4">{row.reviewed_at}</td>
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
