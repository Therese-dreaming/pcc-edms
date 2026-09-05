import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { DonutChart, ReportCard, StatCard } from '@/Components/Reports/Charts';
import BarList from '@/Components/Reports/BarList';
import { DateField, FilterBar, ReportTable, TextField, TrackingPill } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import {
    IconChartDonut, IconClockHour4, IconListDetails, IconShieldExclamation,
} from '@tabler/icons-react';
import { useState } from 'react';

const SEVERITY_TONE = {
    critical: 'bg-danger-bg text-danger-text',
    high: 'bg-warning-bg text-warning-text',
    medium: 'bg-surface-tertiary text-fg-secondary',
    low: 'bg-success-bg text-success-text',
};

function Chip({ tone, children }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${tone ?? 'bg-surface-tertiary text-fg-secondary'}`}>
            {String(children).replace(/_/g, ' ')}
        </span>
    );
}

export default function IncidentSummary({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
        incident_type: filters.incident_type ?? '',
        severity: filters.severity ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.incident-summary'), form, { preserveState: true });
    };

    const openCount = (data.by_status?.reported ?? 0) + (data.by_status?.under_investigation ?? 0) + (data.by_status?.corrective_action_in_progress ?? 0);
    const criticalCount = data.by_severity?.critical ?? 0;

    return (
        <AuthenticatedLayout>
            <Head title="Incident Summary" />

            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10">
                {/* Header — typographic, no icon */}
                <div className="mb-8 border-b border-border pb-6">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Reports</p>
                    <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Incident Summary</h1>
                    <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Reported incidents broken down by type, severity, and resolution status.</p>
                </div>
                <ReportToolbar
                    csvHref={route('reports.incident-summary') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <FilterBar onSubmit={submit}>
                    <DateField label="From" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                    <DateField label="To" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                    <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="All departments" />
                </FilterBar>

                {/* KPI row */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard label="Total incidents" value={data.total} icon={IconListDetails} helper="Matching current filters" />
                    <StatCard label="Still open" value={openCount} icon={IconClockHour4} helper="Not yet resolved/closed" />
                    <StatCard label="Critical" value={criticalCount} icon={IconShieldExclamation} helper="Highest severity band" />
                    <StatCard label="Avg. resolution" value={data.avg_resolution_days !== null ? `${data.avg_resolution_days}d` : '—'} icon={IconChartDonut} helper="Report date → resolved" />
                </div>

                {/* Charts */}
                <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <ReportCard icon={IconChartDonut} title="By type">
                        <DonutChart counts={data.by_type} />
                    </ReportCard>
                    <ReportCard icon={IconShieldExclamation} title="By severity">
                        <DonutChart counts={data.by_severity} />
                    </ReportCard>
                    <ReportCard icon={IconListDetails} title="By status">
                        <BarList counts={data.by_status} />
                    </ReportCard>
                </div>

                {/* Detail table */}
                <ReportCard icon={IconListDetails} title="Incident detail" className="!p-0" right={<span className="text-xs text-fg-tertiary">{data.incidents.length} rows</span>}>
                    <ReportTable
                        rowKey={(r) => r.id}
                        rows={data.incidents}
                        empty="No incidents for the selected filters."
                        columns={[
                            { key: 'tracking_number', label: 'Tracking #', render: (r) => <TrackingPill>{r.tracking_number}</TrackingPill> },
                            { key: 'department', label: 'Department' },
                            { key: 'incident_type', label: 'Type', render: (r) => <span className="capitalize">{r.incident_type.replace(/_/g, ' ')}</span> },
                            { key: 'severity', label: 'Severity', render: (r) => <Chip tone={SEVERITY_TONE[r.severity]}>{r.severity}</Chip> },
                            { key: 'status', label: 'Status', render: (r) => <Chip>{r.status}</Chip> },
                            { key: 'incident_date', label: 'Date', className: 'tabular-nums text-fg-tertiary' },
                        ]}
                    />
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
