import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function ArchiveStudies({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
        final_outcome: filters.final_outcome ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.archive-studies'), form, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Archive Studies Report</h2>}
        >
            <Head title="Archive Studies Report" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.archive-studies') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Archived From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Archived To</label>
                            <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Department</label>
                            <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Final Outcome</label>
                            <select value={form.final_outcome} onChange={(e) => setForm({ ...form, final_outcome: e.target.value })} className="rounded-md border-gray-300 text-sm">
                                <option value="">Any</option>
                                <option value="completed">Completed</option>
                                <option value="discontinued">Discontinued</option>
                                <option value="withdrawn">Withdrawn</option>
                            </select>
                        </div>
                        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Apply
                        </button>
                    </form>

                    <p className="mb-4 text-sm text-gray-600">{data.total} archived studies.</p>

                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tracking #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Research Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">PI</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Final Outcome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Archived</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No archived studies for the selected filters.</td></tr>
                                )}
                                {data.rows.map((row) => (
                                    <tr key={row.tracking_number}>
                                        <td className="px-6 py-4">{row.tracking_number}</td>
                                        <td className="px-6 py-4">{row.research_title}</td>
                                        <td className="px-6 py-4">{row.applicant}</td>
                                        <td className="px-6 py-4">{row.department}</td>
                                        <td className="px-6 py-4 capitalize">{row.final_outcome}</td>
                                        <td className="px-6 py-4">{row.archived_at}</td>
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
