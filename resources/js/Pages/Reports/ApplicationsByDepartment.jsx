import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import BarList from '@/Components/Reports/BarList';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { IconBuildingBank } from '@tabler/icons-react';
import { useState } from 'react';

export default function ApplicationsByDepartment({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.applications-by-department'), form, { preserveState: true });
    };

    const totals = Object.fromEntries(data.departments.map((d) => [d.department, d.total]));

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconBuildingBank}
                    title="Applications by Department"
                    description="Breakdown of DPREQ and REMIS applications submitted by each department."
                />
            }
        >
            <Head title="Applications by Department" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <ReportToolbar
                        csvHref={route('reports.applications-by-department') + '?format=csv&' + new URLSearchParams(form).toString()}
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
                        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                            Apply
                        </button>
                    </form>

                    <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold text-zinc-700">Total applications by department ({data.grand_total} overall)</h3>
                        <BarList counts={totals} />
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">DPREQ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">REMIS</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white">
                                {data.departments.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-zinc-500">No applications for the selected filters.</td></tr>
                                )}
                                {data.departments.map((row) => (
                                    <tr key={row.department}>
                                        <td className="px-6 py-4 font-medium text-zinc-800">{row.department}</td>
                                        <td className="px-6 py-4 text-sm text-zinc-600">
                                            {row.dpreq_total}
                                            {Object.entries(row.dpreq_by_status).map(([status, count]) => (
                                                <span key={status} className="ml-2 text-xs text-zinc-400">{status}: {count}</span>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600">
                                            {row.remis_total}
                                            {Object.entries(row.remis_by_status).map(([status, count]) => (
                                                <span key={status} className="ml-2 text-xs text-zinc-400">{status}: {count}</span>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-zinc-800">{row.total}</td>
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
