import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Whereabouts({ filters, data }) {
    const [form, setForm] = useState({
        as_of: data.as_of ?? '',
        department_assigned: filters.department_assigned ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.whereabouts'), form, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Trainee Whereabouts</h2>}
        >
            <Head title="Trainee Whereabouts" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.whereabouts') + '?format=csv&' + new URLSearchParams(form).toString()}
                    />

                    <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        This is a placement-schedule snapshot ("on-site expected" as of the selected date),
                        not a real-time location/attendance check-in.
                    </p>

                    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">As of</label>
                            <input type="date" value={form.as_of} onChange={(e) => setForm({ ...form, as_of: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Department</label>
                            <input type="text" value={form.department_assigned} onChange={(e) => setForm({ ...form, department_assigned: e.target.value })} className="rounded-md border-gray-300 text-sm" />
                        </div>
                        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Apply
                        </button>
                    </form>

                    <p className="mb-4 text-sm text-gray-600">{data.total} trainees on-site expected as of {data.as_of}.</p>

                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Trainee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">School</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Placement Period</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {data.rows.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No trainees on-site as of the selected date.</td></tr>
                                )}
                                {data.rows.map((row, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4">{row.trainee}</td>
                                        <td className="px-6 py-4">{row.trainee_type}</td>
                                        <td className="px-6 py-4">{row.department_assigned}</td>
                                        <td className="px-6 py-4">{row.enrolled_school}</td>
                                        <td className="px-6 py-4">{row.start_date} – {row.end_date}</td>
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
