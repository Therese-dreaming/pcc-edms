import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { ReportCard, StatCard } from '@/Components/Reports/Charts';
import { DateField, FilterBar, ReportTable, SelectField, TextField, TrackingPill } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import { IconArchive } from '@tabler/icons-react';
import { useState } from 'react';

const OUTCOME_TONE = {
    completed: 'bg-success-bg text-success-text',
    discontinued: 'bg-warning-bg text-warning-text',
    withdrawn: 'bg-danger-bg text-danger-text',
};

export default function ArchiveStudies({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
        final_outcome: filters.final_outcome ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.archive-studies'), form, { preserveState: true });
    };

    const byOutcome = data.rows.reduce((acc, r) => {
        acc[r.final_outcome] = (acc[r.final_outcome] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconArchive}
                    title="Archive Studies Report"
                    description="Studies that have reached final outcome and been moved to the archive."
                />
            }
        >
            <Head title="Archive Studies Report" />

            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10">
                <ReportToolbar
                    csvHref={route('reports.archive-studies') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <FilterBar onSubmit={submit}>
                    <DateField label="Archived from" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                    <DateField label="Archived to" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                    <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="All departments" />
                    <SelectField label="Final outcome" value={form.final_outcome} onChange={(e) => setForm({ ...form, final_outcome: e.target.value })}>
                        <option value="">Any</option>
                        <option value="completed">Completed</option>
                        <option value="discontinued">Discontinued</option>
                        <option value="withdrawn">Withdrawn</option>
                    </SelectField>
                </FilterBar>

                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Archived studies" value={data.total} icon={IconArchive} helper="Matching current filters" />
                    <StatCard label="Completed" value={byOutcome.completed ?? 0} />
                    <StatCard label="Discontinued" value={byOutcome.discontinued ?? 0} />
                    <StatCard label="Withdrawn" value={byOutcome.withdrawn ?? 0} />
                </div>

                <ReportCard icon={IconArchive} title="Archived studies" className="!p-0" right={<span className="text-xs text-fg-tertiary">{data.rows.length} rows</span>}>
                    <ReportTable
                        rowKey={(r) => r.tracking_number}
                        rows={data.rows}
                        empty="No archived studies for the selected filters."
                        columns={[
                            { key: 'tracking_number', label: 'Tracking #', render: (r) => <TrackingPill>{r.tracking_number}</TrackingPill> },
                            { key: 'research_title', label: 'Research title', className: 'max-w-xs truncate font-medium text-fg-primary', render: (r) => <span title={r.research_title}>{r.research_title}</span> },
                            { key: 'applicant', label: 'PI' },
                            { key: 'department', label: 'Department' },
                            {
                                key: 'final_outcome', label: 'Outcome', render: (r) => (
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${OUTCOME_TONE[r.final_outcome] ?? 'bg-surface-tertiary text-fg-secondary'}`}>
                                        {r.final_outcome}
                                    </span>
                                ),
                            },
                            { key: 'archived_at', label: 'Archived', className: 'tabular-nums text-fg-tertiary' },
                        ]}
                    />
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
