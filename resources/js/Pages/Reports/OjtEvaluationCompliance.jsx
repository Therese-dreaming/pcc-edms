import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { IconClipboardCheck } from '@tabler/icons-react';
import { useState } from 'react';

export default function OjtEvaluationCompliance({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.ojt-evaluation-compliance'), form, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconClipboardCheck}
                    title="OJT Evaluation Report Compliance"
                    description="Departments' submission status for OJT trainee evaluation reports after placement ends."
                />
            }
        >
            <Head title="OJT Evaluation Report Compliance" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.ojt-evaluation-compliance') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Placement Ended From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Placement Ended To</label>
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

                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-2 text-sm font-semibold text-success-text">Compliant Departments</h3>
                            <ul className="text-sm text-zinc-700">
                                {data.compliant_departments.length === 0 && <li className="text-zinc-400">None</li>}
                                {data.compliant_departments.map((d) => <li key={d}>{d}</li>)}
                            </ul>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-2 text-sm font-semibold text-danger-text">Non-Compliant Departments</h3>
                            <ul className="text-sm text-zinc-700">
                                {data.non_compliant_departments.length === 0 && <li className="text-zinc-400">None</li>}
                                {data.non_compliant_departments.map((d) => <li key={d}>{d}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Uploaded</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Not Uploaded</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-zinc-500">No placements ended in the selected range.</td></tr>
                                )}
                                {data.rows.map((row) => (
                                    <tr key={row.department}>
                                        <td className="px-6 py-4 font-medium text-zinc-800">{row.department}</td>
                                        <td className="px-6 py-4">{row.uploaded}</td>
                                        <td className="px-6 py-4">{row.not_uploaded}</td>
                                        <td className="px-6 py-4">{row.total}</td>
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
