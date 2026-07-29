import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { ColumnChart, ReportCard, StatCard } from '@/Components/Reports/Charts';
import { DateField, FilterBar, ReportTable, SelectField } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import { IconChartBar, IconClockHour4, IconUsers } from '@tabler/icons-react';
import { useState } from 'react';

export default function ReviewerWorkload({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        risk_track: filters.risk_track ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.reviewer-workload'), form, { preserveState: true });
    };

    const sorted = [...data.rows].sort((a, b) => (b.active + b.completed) - (a.active + a.completed));
    const activeTotal = sorted.reduce((s, r) => s + r.active, 0);
    const completedTotal = sorted.reduce((s, r) => s + r.completed, 0);
    const activeChart = Object.fromEntries(sorted.slice(0, 8).map((r) => [r.reviewer, r.active]));

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconUsers}
                    title="Reviewer Workload"
                    description="Active and completed review assignments per reviewer, with average turnaround."
                />
            }
        >
            <Head title="Reviewer Workload" />

            <div className="mx-auto max-w-5xl px-5 py-8 sm:px-7 lg:px-10">
                <ReportToolbar
                    csvHref={route('reports.reviewer-workload') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <FilterBar onSubmit={submit}>
                    <DateField label="Assigned from" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                    <DateField label="Assigned to" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                    <SelectField label="Risk track" value={form.risk_track} onChange={(e) => setForm({ ...form, risk_track: e.target.value })}>
                        <option value="">Any</option>
                        <option value="expedited">Expedited</option>
                        <option value="committee">Committee</option>
                        <option value="full_board">Full Board</option>
                    </SelectField>
                </FilterBar>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard label="Reviewers" value={sorted.length} icon={IconUsers} helper="With assignments in range" />
                    <StatCard label="Active assignments" value={activeTotal} icon={IconClockHour4} helper="Currently in progress" />
                    <StatCard label="Completed" value={completedTotal} icon={IconChartBar} helper="Finished reviews" />
                </div>

                {sorted.length > 0 && (
                    <div className="mb-6">
                        <ReportCard icon={IconChartBar} title="Active assignments per reviewer">
                            <ColumnChart counts={activeChart} />
                        </ReportCard>
                    </div>
                )}

                <ReportCard icon={IconUsers} title="Workload detail" className="!p-0" right={<span className="text-xs text-fg-tertiary">{sorted.length} reviewers</span>}>
                    <ReportTable
                        rowKey={(r) => r.reviewer}
                        rows={sorted}
                        empty="No review assignments for the selected filters."
                        columns={[
                            { key: 'reviewer', label: 'Reviewer', className: 'font-medium text-fg-primary' },
                            { key: 'active', label: 'Active', className: 'tabular-nums' },
                            { key: 'completed', label: 'Completed', className: 'tabular-nums' },
                            { key: 'avg_turnaround_days', label: 'Avg turnaround', className: 'tabular-nums text-fg-tertiary', render: (r) => r.avg_turnaround_days !== null ? `${r.avg_turnaround_days} days` : '—' },
                        ]}
                    />
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
