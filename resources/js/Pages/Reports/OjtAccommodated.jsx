import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { IconAccessible } from '@tabler/icons-react';
import { useState } from 'react';

export default function OjtAccommodated({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        granularity: filters.granularity ?? 'month',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.ojt-accommodated'), form, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconAccessible}
                    title="OJTs Accommodated"
                    description="Count of on-the-job trainees placed per period, school, and department."
                />
            }
        >
            <Head title="OJTs Accommodated" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.ojt-accommodated') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Start From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Start To</label>
                            <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} className="rounded-md border-zinc-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Granularity</label>
                            <select value={form.granularity} onChange={(e) => setForm({ ...form, granularity: e.target.value })} className="rounded-md border-zinc-300 text-sm">
                                <option value="month">Month</option>
                                <option value="year">Year</option>
                            </select>
                        </div>
                        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                            Apply
                        </button>
                    </form>

                    <p className="mb-4 text-sm text-zinc-600">{data.total} placements.</p>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Period</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">School</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Department/Office</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-4 text-center text-zinc-500">No OJT placements for the selected filters.</td></tr>
                                )}
                                {data.rows.map((row, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4">{row.period}</td>
                                        <td className="px-6 py-4">{row.enrolled_school}</td>
                                        <td className="px-6 py-4">{row.department_assigned}</td>
                                        <td className="px-6 py-4">{row.trainee_type === 'internal_ojt' ? 'Internal' : 'External'}</td>
                                        <td className="px-6 py-4">{row.count}</td>
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
