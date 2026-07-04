import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BarList from '@/Components/Reports/BarList';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function AnnualEthics({ year, data }) {
    const [selectedYear, setSelectedYear] = useState(year);

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.annual-ethics'), { year: selectedYear }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Annual Ethics Report</h2>}
        >
            <Head title="Annual Ethics Report" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <ReportToolbar>
                        <a
                            href={route('reports.annual-ethics.pdf') + '?year=' + selectedYear}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Download PDF
                        </a>
                    </ReportToolbar>

                    <form onSubmit={submit} className="mb-6 flex items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Year</label>
                            <input
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-28 rounded-md border-gray-300 text-sm"
                            />
                        </div>
                        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            View
                        </button>
                    </form>

                    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
                        {[
                            ['Submitted', data.total_submitted],
                            ['Approved', data.total_approved],
                            ['Deferred', data.total_deferred],
                            ['Disapproved', data.total_disapproved],
                            ['Archived', data.archived_count],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-lg bg-white p-4 text-center shadow-sm">
                                <div className="text-2xl font-semibold text-gray-800">{value}</div>
                                <div className="text-xs text-gray-500">{label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">By Risk Level</h3>
                            <BarList counts={data.by_risk_level} />
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">By Department</h3>
                            <BarList counts={data.by_department} />
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">By Study Type</h3>
                            <BarList counts={data.by_study_type} />
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">Monitoring Compliance</h3>
                            <BarList counts={data.compliance_summary} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
