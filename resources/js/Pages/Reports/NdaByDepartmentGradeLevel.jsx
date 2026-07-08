import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { IconFileCertificate } from '@tabler/icons-react';
import { useState } from 'react';

export default function NdaByDepartmentGradeLevel({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.nda-by-department-grade-level'), form, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconFileCertificate}
                    title="Accomplished NDAs by Department and Grade Level"
                    description="Completed non-disclosure agreements cross-tabulated by host department and trainee grade level."
                />
            }
        >
            <Head title="NDAs by Department and Grade Level" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.nda-by-department-grade-level') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Signed From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Signed To</label>
                            <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                            Apply
                        </button>
                    </form>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Host Department</th>
                                    {data.levels.map((level) => (
                                        <th key={level} className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">{level}</th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={data.levels.length + 2} className="px-6 py-4 text-center text-zinc-500">No completed NDAs for the selected filters.</td></tr>
                                )}
                                {data.rows.map((row) => (
                                    <tr key={row.department}>
                                        <td className="px-6 py-4 font-medium text-zinc-800">{row.department}</td>
                                        {data.levels.map((level) => (
                                            <td key={level} className="px-6 py-4">{row.counts[level] ?? 0}</td>
                                        ))}
                                        <td className="px-6 py-4 font-semibold text-zinc-800">{row.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {data.rows.length > 0 && (
                                <tfoot className="bg-zinc-50">
                                    <tr>
                                        <td className="px-6 py-3 font-semibold text-zinc-800">Grand Total</td>
                                        <td colSpan={data.levels.length} />
                                        <td className="px-6 py-3 font-semibold text-zinc-800">{data.grand_total}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
