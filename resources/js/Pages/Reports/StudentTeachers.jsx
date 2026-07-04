import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function StudentTeachers({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.student-teachers'), form, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Student Teachers Observing Classes</h2>}
        >
            <Head title="Student Teachers" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.student-teachers') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        Grouped by grade level, department, and school. An internal/external split is not
                        yet tracked for student teachers in the placement schema (only OJT placements
                        record that distinction) — flagged for a future session.
                    </p>

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Start From</label>
                            <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Start To</label>
                            <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Apply
                        </button>
                    </form>

                    <p className="mb-4 text-sm text-gray-600">{data.total} placements.</p>

                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Grade Level</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">School</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No student teacher placements for the selected filters.</td></tr>
                                )}
                                {data.rows.map((row, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4">{row.level}</td>
                                        <td className="px-6 py-4">{row.department_assigned}</td>
                                        <td className="px-6 py-4">{row.enrolled_school}</td>
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
