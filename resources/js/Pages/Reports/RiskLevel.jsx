import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import BarList from '@/Components/Reports/BarList';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { IconChartPie } from '@tabler/icons-react';
import { useState } from 'react';

export default function RiskLevel({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
        study_type: filters.study_type ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.risk-level'), form, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconChartPie}
                    title="Applications by Risk Level"
                    description="Classified applications grouped by risk level, study type, and review type."
                />
            }
        >
            <Head title="Applications by Risk Level" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.risk-level') + '?format=csv&' + new URLSearchParams(form).toString()}
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
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Study Type</label>
                            <select value={form.study_type} onChange={(e) => setForm({ ...form, study_type: e.target.value })} className="rounded-md border-zinc-300 text-sm">
                                <option value="">Any</option>
                                <option value="thesis_dissertation">Thesis/Dissertation</option>
                                <option value="faculty_research">Faculty Research</option>
                                <option value="institutional">Institutional</option>
                                <option value="sponsored">Sponsored</option>
                            </select>
                        </div>
                        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                            Apply
                        </button>
                    </form>

                    <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold text-zinc-700">By risk level ({data.total} total)</h3>
                        <BarList counts={data.by_level} />
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Tracking #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Study Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Risk Level</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Review Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Classified</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-zinc-500">No classified applications for the selected filters.</td></tr>
                                )}
                                {data.rows.map((row) => (
                                    <tr key={row.tracking_number}>
                                        <td className="px-6 py-4">{row.tracking_number}</td>
                                        <td className="px-6 py-4">{row.department}</td>
                                        <td className="px-6 py-4">{row.study_type}</td>
                                        <td className="px-6 py-4 capitalize">{row.level}</td>
                                        <td className="px-6 py-4">{row.review_type}</td>
                                        <td className="px-6 py-4">{row.classification_date}</td>
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
