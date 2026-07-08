import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import BarList from '@/Components/Reports/BarList';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { Head, router } from '@inertiajs/react';
import { IconChartBar } from '@tabler/icons-react';
import { useState } from 'react';

export default function AnnualEthics({ year, data }) {
    const [selectedYear, setSelectedYear] = useState(year);

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.annual-ethics'), { year: selectedYear }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconChartBar}
                    title="Annual Ethics Report"
                    description="Yearly summary of REMIS applications by outcome, risk, and department."
                />
            }
        >
            <Head title="Annual Ethics Report" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <ReportToolbar>
                        <a
                            href={route('reports.annual-ethics.pdf') + '?year=' + selectedYear}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
                        >
                            Download PDF
                        </a>
                    </ReportToolbar>

                    <form onSubmit={submit} className="mb-6 flex items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600">Year</label>
                            <input
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-28 rounded-md border-zinc-300 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
                            />
                        </div>
                        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
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
                            <div key={label} className="rounded-lg border border-zinc-200 bg-white p-4 text-center shadow-sm">
                                <div className="text-2xl font-semibold text-zinc-800">{value}</div>
                                <div className="text-xs text-zinc-500">{label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-zinc-700">By Risk Level</h3>
                            <BarList counts={data.by_risk_level} />
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-zinc-700">By Department</h3>
                            <BarList counts={data.by_department} />
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-zinc-700">By Study Type</h3>
                            <BarList counts={data.by_study_type} />
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-zinc-700">Monitoring Compliance</h3>
                            <BarList counts={data.compliance_summary} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
