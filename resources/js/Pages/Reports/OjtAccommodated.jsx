import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { ColumnChart, ReportCard, StatCard } from '@/Components/Reports/Charts';
import { DateField, FilterBar, ReportTable, SelectField } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import { IconAccessible, IconBuildingCommunity, IconCalendarStats } from '@tabler/icons-react';
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

    // Aggregate placements per period for the trend column chart.
    const byPeriod = {};
    for (const row of data.rows) {
        byPeriod[row.period] = (byPeriod[row.period] ?? 0) + row.count;
    }
    const internal = data.rows.filter((r) => r.trainee_type === 'internal_ojt').reduce((s, r) => s + r.count, 0);
    const external = data.total - internal;

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

            <div className="mx-auto max-w-5xl px-5 py-8 sm:px-7 lg:px-10">
                <ReportToolbar
                    csvHref={route('reports.ojt-accommodated') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <FilterBar onSubmit={submit}>
                    <DateField label="Start from" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                    <DateField label="Start to" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                    <SelectField label="Granularity" value={form.granularity} onChange={(e) => setForm({ ...form, granularity: e.target.value })}>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                    </SelectField>
                </FilterBar>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard label="Total placements" value={data.total} icon={IconAccessible} helper="Matching current filters" />
                    <StatCard label="Internal OJTs" value={internal} icon={IconBuildingCommunity} helper="PCC-enrolled trainees" />
                    <StatCard label="External OJTs" value={external} icon={IconBuildingCommunity} helper="From other schools" />
                </div>

                {Object.keys(byPeriod).length > 0 && (
                    <div className="mb-6">
                        <ReportCard icon={IconCalendarStats} title="Placements per period">
                            <ColumnChart counts={byPeriod} />
                        </ReportCard>
                    </div>
                )}

                <ReportCard icon={IconAccessible} title="Placement detail" className="!p-0" right={<span className="text-xs text-fg-tertiary">{data.rows.length} rows</span>}>
                    <ReportTable
                        rows={data.rows}
                        empty="No OJT placements for the selected filters."
                        columns={[
                            { key: 'period', label: 'Period', className: 'font-medium text-fg-primary tabular-nums' },
                            { key: 'enrolled_school', label: 'School' },
                            { key: 'department_assigned', label: 'Department/Office' },
                            {
                                key: 'trainee_type', label: 'Type', render: (r) => (
                                    <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-[11px] font-semibold text-fg-secondary">
                                        {r.trainee_type === 'internal_ojt' ? 'Internal' : 'External'}
                                    </span>
                                ),
                            },
                            { key: 'count', label: 'Count', className: 'font-semibold text-fg-primary tabular-nums' },
                        ]}
                    />
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
