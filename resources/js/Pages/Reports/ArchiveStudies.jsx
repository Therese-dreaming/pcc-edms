import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { IconArchive } from '@tabler/icons-react';
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
            header={
                <PageHeader
                    icon={IconArchive}
                    title="Archive Studies Report"
                    description="Studies that have reached final outcome and been moved to the archive."
                />
            }
        >
            <Head title="Archive Studies Report" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.archive-studies') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Archived From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Archived To</label>
                            <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Department</label>
                            <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Final Outcome</label>
                            <select value={form.final_outcome} onChange={(e) => setForm({ ...form, final_outcome: e.target.value })} className="rounded-md border-zinc-300 text-sm">
                                <option value="">Any</option>
                                <option value="completed">Completed</option>
                                <option value="discontinued">Discontinued</option>
                                <option value="withdrawn">Withdrawn</option>
                            </select>
                        </div>
                        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                            Apply
                        </button>
                    </form>

                    <p className="mb-4 text-sm text-zinc-600">{data.total} archived studies.</p>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Tracking #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Research Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">PI</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Final Outcome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Archived</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-zinc-500">No archived studies for the selected filters.</td></tr>
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
