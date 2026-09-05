import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { DonutChart, ReportCard, StatCard } from '@/Components/Reports/Charts';
import { DateField, FilterBar, ReportTable, SelectField, TextField, TrackingPill } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import { IconAlertTriangle, IconClipboardCheck, IconShieldCheck } from '@tabler/icons-react';
import { useState } from 'react';

const COMPLIANCE_LABELS = {
    compliant: 'Compliant',
    minor_issues: 'Minor Issues',
    major_issues: 'Major Issues',
    non_compliant: 'Non-Compliant',
};

const COMPLIANCE_TONE = {
    compliant: 'bg-success-bg text-success-text',
    minor_issues: 'bg-warning-bg text-warning-text',
    major_issues: 'bg-warning-bg text-warning-text',
    non_compliant: 'bg-danger-bg text-danger-text',
};

export default function ComplianceMonitoring({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
        compliance_status: filters.compliance_status ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.compliance-monitoring'), form, { preserveState: true });
    };

    const compliant = data.by_status?.compliant ?? 0;
    const flagged = (data.by_status?.major_issues ?? 0) + (data.by_status?.non_compliant ?? 0);
    const rate = data.total > 0 ? Math.round((compliant / data.total) * 100) : 0;

    return (
        <AuthenticatedLayout>
            <Head title="Compliance Monitoring Report" />

            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10">
                {/* Header — typographic, no icon */}
                <div className="mb-8 border-b border-border pb-6">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Reports</p>
                    <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Compliance Monitoring Report</h1>
                    <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">REMIS monitoring compliance status of reviewed progress reports.</p>
                </div>
                <ReportToolbar
                    csvHref={route('reports.compliance-monitoring') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <div className="mb-6 flex items-start gap-2 rounded-xl border border-warning bg-warning-bg p-3.5 text-sm text-warning-text">
                    <IconAlertTriangle size={17} className="mt-0.5 shrink-0" />
                    <p>This reads REMIS monitoring compliance statuses only — DPO has no compliance-declaration data model yet, so this report does not cover the DPREQ track.</p>
                </div>

                <FilterBar onSubmit={submit}>
                    <DateField label="Reviewed from" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                    <DateField label="Reviewed to" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                    <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="All departments" />
                    <SelectField label="Compliance status" value={form.compliance_status} onChange={(e) => setForm({ ...form, compliance_status: e.target.value })}>
                        <option value="">Any</option>
                        <option value="compliant">Compliant</option>
                        <option value="minor_issues">Minor Issues</option>
                        <option value="major_issues">Major Issues</option>
                        <option value="non_compliant">Non-Compliant</option>
                    </SelectField>
                </FilterBar>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard label="Reviewed reports" value={data.total} icon={IconClipboardCheck} helper="Matching current filters" />
                    <StatCard label="Compliance rate" value={`${rate}%`} icon={IconShieldCheck} helper={`${compliant} compliant`} trendDirection={rate >= 70 ? 'up' : 'down'} />
                    <StatCard label="Flagged" value={flagged} icon={IconAlertTriangle} helper="Major issues / non-compliant" />
                </div>

                <div className="mb-6">
                    <ReportCard icon={IconClipboardCheck} title={`Compliance status distribution (${data.total} total)`}>
                        <DonutChart counts={data.by_status} labels={COMPLIANCE_LABELS} />
                    </ReportCard>
                </div>

                <ReportCard icon={IconShieldCheck} title="Progress report detail" className="!p-0" right={<span className="text-xs text-fg-tertiary">{data.rows.length} rows</span>}>
                    <ReportTable
                        rows={data.rows}
                        empty="No reviewed progress reports for the selected filters."
                        columns={[
                            { key: 'tracking_number', label: 'Tracking #', render: (r) => <TrackingPill>{r.tracking_number}</TrackingPill> },
                            { key: 'department', label: 'Department' },
                            { key: 'status_of_study', label: 'Study status', render: (r) => <span className="capitalize">{String(r.status_of_study).replace(/_/g, ' ')}</span> },
                            {
                                key: 'compliance_status', label: 'Compliance', render: (r) => (
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${COMPLIANCE_TONE[r.compliance_status] ?? 'bg-surface-tertiary text-fg-secondary'}`}>
                                        {COMPLIANCE_LABELS[r.compliance_status] ?? r.compliance_status}
                                    </span>
                                ),
                            },
                            { key: 'review_notes', label: 'Notes', className: 'max-w-xs truncate', render: (r) => <span title={r.review_notes ?? ''}>{r.review_notes ?? '—'}</span> },
                            { key: 'reviewed_at', label: 'Reviewed', className: 'tabular-nums text-fg-tertiary' },
                        ]}
                    />
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
