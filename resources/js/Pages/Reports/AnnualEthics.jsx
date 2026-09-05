import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import BarList from '@/Components/Reports/BarList';
import { DonutChart, ReportCard, StatCard } from '@/Components/Reports/Charts';
import { Field } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import {
    IconBuildingBank, IconChartBar, IconChartDonut, IconClipboardCheck,
    IconDownload, IconFlask,
} from '@tabler/icons-react';
import { useState } from 'react';

export default function AnnualEthics({ year, data }) {
    const [selectedYear, setSelectedYear] = useState(year);

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.annual-ethics'), { year: selectedYear }, { preserveState: true });
    };

    const approvalRate = data.total_submitted > 0 ? Math.round((data.total_approved / data.total_submitted) * 100) : 0;

    return (
        <AuthenticatedLayout>
            <Head title="Annual Ethics Report" />

            <div className="mx-auto max-w-5xl px-5 py-8 sm:px-7 lg:px-10">
                {/* Header — typographic, no icon */}
                <div className="mb-8 border-b border-border pb-6">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Reports</p>
                    <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Annual Ethics Report</h1>
                    <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Yearly summary of REMIS applications by outcome, risk, and department.</p>
                </div>
                <ReportToolbar>
                    <a
                        href={route('reports.annual-ethics.pdf') + '?year=' + selectedYear}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-medium bg-surface-primary px-4 text-sm font-semibold text-fg-secondary transition-colors hover:border-primary hover:bg-surface-tertiary hover:text-primary"
                    >
                        <IconDownload size={16} /> Download PDF
                    </a>
                </ReportToolbar>

                <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-primary p-4 shadow-resting">
                    <Field label="Year">
                        <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="mt-1.5 block w-32 rounded-full border-border-medium bg-surface-secondary text-sm text-fg-primary focus:border-primary focus:ring-3 focus:ring-primary-soft"
                        />
                    </Field>
                    <button
                        type="submit"
                        className="ml-auto inline-flex min-h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-strong focus:outline-none focus-visible:ring-3 focus-visible:ring-primary-soft"
                    >
                        View
                    </button>
                </form>

                {/* KPI row */}
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
                    <StatCard label="Submitted" value={data.total_submitted} icon={IconFlask} />
                    <StatCard label="Approved" value={data.total_approved} icon={IconClipboardCheck} helper={`${approvalRate}% of submitted`} trendDirection={approvalRate >= 50 ? 'up' : 'down'} />
                    <StatCard label="Deferred" value={data.total_deferred} />
                    <StatCard label="Disapproved" value={data.total_disapproved} />
                    <StatCard label="Archived" value={data.archived_count} />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ReportCard icon={IconChartDonut} title="By risk level">
                        <DonutChart counts={data.by_risk_level} />
                    </ReportCard>
                    <ReportCard icon={IconBuildingBank} title="By department">
                        <BarList counts={data.by_department} />
                    </ReportCard>
                    <ReportCard icon={IconFlask} title="By study type">
                        <BarList counts={data.by_study_type} />
                    </ReportCard>
                    <ReportCard icon={IconChartBar} title="Monitoring compliance">
                        <BarList counts={data.compliance_summary} />
                    </ReportCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
