import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { ReportCard, StatCard } from '@/Components/Reports/Charts';
import { DateField, FilterBar, ReportTable, TextField, TrackingPill } from '@/Components/Reports/ReportFilters';
import { Head, Link, router } from '@inertiajs/react';
import { IconClockHour4, IconHourglass, IconListDetails } from '@tabler/icons-react';
import { useState } from 'react';

const STATUS_LABELS = {
    submitted: 'Submitted',
    screening: 'Screening',
    returned: 'Returned',
    under_review: 'Under Review',
    endorsed: 'Endorsed',
};

// Colour the days-pending value so a backlog stands out (green fresh → amber → red overdue).
function daysTone(days) {
    if (days >= 14) return 'bg-danger-bg text-danger-text';
    if (days >= 7) return 'bg-warning-bg text-warning-text';
    return 'bg-success-bg text-success-text';
}

export default function PendingApprovals({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.pending-dpo-approvals'), form, { preserveState: true });
    };

    const daysList = data.rows.map((r) => r.days_pending ?? 0);
    const oldest = daysList.length ? Math.max(...daysList) : 0;
    const avg = daysList.length ? Math.round(daysList.reduce((s, d) => s + d, 0) / daysList.length) : 0;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconClockHour4}
                    title="Pending DPO Approvals"
                    description="DPREQ applications still awaiting a decision, with days pending per submission."
                />
            }
        >
            <Head title="Pending DPO Approvals" />

            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10">
                <ReportToolbar
                    csvHref={route('reports.pending-dpo-approvals') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <FilterBar onSubmit={submit}>
                    <DateField label="Submitted from" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                    <DateField label="Submitted to" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                    <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="All departments" />
                </FilterBar>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard label="Pending applications" value={data.total} icon={IconListDetails} helper="Awaiting a DPO decision" />
                    <StatCard label="Avg. days pending" value={`${avg}d`} icon={IconHourglass} helper="Across the queue" trendDirection={avg <= 7 ? 'up' : 'down'} />
                    <StatCard label="Oldest" value={`${oldest}d`} icon={IconClockHour4} helper="Longest wait in queue" trendDirection={oldest <= 14 ? 'up' : 'down'} />
                </div>

                <ReportCard icon={IconClockHour4} title="Pending queue" className="!p-0" right={<span className="text-xs text-fg-tertiary">{data.rows.length} rows</span>}>
                    <ReportTable
                        rowKey={(r) => r.id}
                        rows={data.rows}
                        empty="No pending approvals for the selected filters."
                        columns={[
                            { key: 'tracking_number', label: 'Tracking #', render: (r) => <Link href={route('dpreq.show', r.id)}><TrackingPill>{r.tracking_number}</TrackingPill></Link> },
                            { key: 'applicant', label: 'Applicant', className: 'font-medium text-fg-primary' },
                            { key: 'department', label: 'Department' },
                            { key: 'submitted_at', label: 'Submitted', className: 'tabular-nums text-fg-tertiary' },
                            { key: 'status', label: 'Status', render: (r) => <span className="capitalize">{STATUS_LABELS[r.status] ?? r.status}</span> },
                            { key: 'comments', label: 'Comments', className: 'max-w-xs truncate', render: (r) => <span title={r.comments ?? ''}>{r.comments ?? '—'}</span> },
                            {
                                key: 'days_pending', label: 'Days pending', render: (r) => (
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${daysTone(r.days_pending ?? 0)}`}>
                                        {r.days_pending}d
                                    </span>
                                ),
                            },
                        ]}
                    />
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
