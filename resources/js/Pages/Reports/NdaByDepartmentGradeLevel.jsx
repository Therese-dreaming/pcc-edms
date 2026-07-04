import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
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
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Accomplished NDAs by Department and Grade Level</h2>}
        >
            <Head title="NDAs by Department and Grade Level" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.nda-by-department-grade-level') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Signed From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Signed To</label>
                            <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Apply
                        </button>
                    </form>

                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Host Department</th>
                                    {data.levels.map((level) => (
                                        <th key={level} className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">{level}</th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={data.levels.length + 2} className="px-6 py-4 text-center text-gray-500">No completed NDAs for the selected filters.</td></tr>
                                )}
                                {data.rows.map((row) => (
                                    <tr key={row.department}>
                                        <td className="px-6 py-4 font-medium text-gray-800">{row.department}</td>
                                        {data.levels.map((level) => (
                                            <td key={level} className="px-6 py-4">{row.counts[level] ?? 0}</td>
                                        ))}
                                        <td className="px-6 py-4 font-semibold text-gray-800">{row.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {data.rows.length > 0 && (
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td className="px-6 py-3 font-semibold text-gray-800">Grand Total</td>
                                        <td colSpan={data.levels.length} />
                                        <td className="px-6 py-3 font-semibold text-gray-800">{data.grand_total}</td>
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
