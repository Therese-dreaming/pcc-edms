import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { DonutChart, ReportCard, StatCard } from '@/Components/Reports/Charts';
import { DateField, FilterBar, ReportTable, SelectField, TextField, TrackingPill } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import { IconChartPie, IconShieldCheck, IconStack2 } from '@tabler/icons-react';
import { useState } from 'react';

const LEVEL_TONE = {
    high: 'bg-danger-bg text-danger-text',
    more_than_minimal: 'bg-warning-bg text-warning-text',
    moderate: 'bg-warning-bg text-warning-text',
    minimal: 'bg-success-bg text-success-text',
};

export default function RiskLevel({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
        study_type: filters.study_type ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.risk-level'), form, { preserveState: true });
    };

    const highest = Object.entries(data.by_level ?? {}).sort((a, b) => b[1] - a[1])[0];

    return (
        <AuthenticatedLayout>
            <Head title="Applications by Risk Level" />

            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10">
                {/* Header — typographic, no icon */}
                <div className="mb-8 border-b border-border pb-6">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Reports</p>
                    <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Applications by Risk Level</h1>
                    <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Classified applications grouped by risk level, study type, and review type.</p>
                </div>
                <ReportToolbar
                    csvHref={route('reports.risk-level') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <FilterBar onSubmit={submit}>
                    <DateField label="From" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                    <DateField label="To" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                    <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="All departments" />
                    <SelectField label="Study type" value={form.study_type} onChange={(e) => setForm({ ...form, study_type: e.target.value })}>
                        <option value="">Any</option>
                        <option value="thesis_dissertation">Thesis/Dissertation</option>
                        <option value="faculty_research">Faculty Research</option>
                        <option value="institutional">Institutional</option>
                        <option value="sponsored">Sponsored</option>
                    </SelectField>
                </FilterBar>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <StatCard label="Classified applications" value={data.total} icon={IconStack2} helper="Matching current filters" />
                    <StatCard label="Most common level" value={highest ? highest[0].replace(/_/g, ' ') : '—'} icon={IconShieldCheck} helper={highest ? `${highest[1]} applications` : 'No data'} />
                </div>

                <div className="mb-6">
                    <ReportCard icon={IconChartPie} title={`Risk level distribution (${data.total} total)`}>
                        <DonutChart counts={data.by_level} />
                    </ReportCard>
                </div>

                <ReportCard icon={IconShieldCheck} title="Classified applications" className="!p-0" right={<span className="text-xs text-fg-tertiary">{data.rows.length} rows</span>}>
                    <ReportTable
                        rowKey={(r) => r.tracking_number}
                        rows={data.rows}
                        empty="No classified applications for the selected filters."
                        columns={[
                            { key: 'tracking_number', label: 'Tracking #', render: (r) => <TrackingPill>{r.tracking_number}</TrackingPill> },
                            { key: 'department', label: 'Department' },
                            { key: 'study_type', label: 'Study type', render: (r) => <span className="capitalize">{String(r.study_type).replace(/_/g, ' ')}</span> },
                            {
                                key: 'level', label: 'Risk level', render: (r) => (
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${LEVEL_TONE[r.level] ?? 'bg-surface-tertiary text-fg-secondary'}`}>
                                        {String(r.level).replace(/_/g, ' ')}
                                    </span>
                                ),
                            },
                            { key: 'review_type', label: 'Review type', render: (r) => <span className="capitalize">{String(r.review_type).replace(/_/g, ' ')}</span> },
                            { key: 'classification_date', label: 'Classified', className: 'tabular-nums text-fg-tertiary' },
                        ]}
                    />
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
