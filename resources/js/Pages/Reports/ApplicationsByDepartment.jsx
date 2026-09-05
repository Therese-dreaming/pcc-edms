import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { ColumnChart, ReportCard, StatCard } from '@/Components/Reports/Charts';
import { DateField, FilterBar, ReportTable, TextField } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import { IconBuildingBank, IconChartBar, IconFileDescription, IconStack2 } from '@tabler/icons-react';
import { useState } from 'react';

export default function ApplicationsByDepartment({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.applications-by-department'), form, { preserveState: true });
    };

    const totals = Object.fromEntries(data.departments.map((d) => [d.department, d.total]));
    const dpreqTotal = data.departments.reduce((s, d) => s + d.dpreq_total, 0);
    const remisTotal = data.departments.reduce((s, d) => s + d.remis_total, 0);

    return (
        <AuthenticatedLayout>
            <Head title="Applications by Department" />

            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10">
                {/* Header — typographic, no icon */}
                <div className="mb-8 border-b border-border pb-6">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Reports</p>
                    <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Applications by Department</h1>
                    <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Breakdown of DPREQ and REMIS applications submitted by each department.</p>
                </div>
                <ReportToolbar
                    csvHref={route('reports.applications-by-department') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <FilterBar onSubmit={submit}>
                    <DateField label="From" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                    <DateField label="To" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                    <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="All departments" />
                </FilterBar>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard label="Total applications" value={data.grand_total} icon={IconStack2} helper={`${data.departments.length} departments`} />
                    <StatCard label="DPREQ (Data Privacy)" value={dpreqTotal} icon={IconFileDescription} helper="Data privacy track" />
                    <StatCard label="REMIS (Ethics)" value={remisTotal} icon={IconFileDescription} helper="Ethics review track" />
                </div>

                <div className="mb-6">
                    <ReportCard icon={IconChartBar} title={`Applications per department (${data.grand_total} overall)`}>
                        <ColumnChart counts={totals} />
                    </ReportCard>
                </div>

                <ReportCard icon={IconBuildingBank} title="Department detail" className="!p-0" right={<span className="text-xs text-fg-tertiary">{data.departments.length} rows</span>}>
                    <ReportTable
                        rowKey={(r) => r.department}
                        rows={data.departments}
                        empty="No applications for the selected filters."
                        columns={[
                            { key: 'department', label: 'Department', className: 'font-medium text-fg-primary' },
                            {
                                key: 'dpreq', label: 'DPREQ', render: (r) => (
                                    <span className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-semibold text-fg-primary tabular-nums">{r.dpreq_total}</span>
                                        {Object.entries(r.dpreq_by_status).map(([s, c]) => (
                                            <span key={s} className="rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[10px] capitalize text-fg-tertiary">{s.replace(/_/g, ' ')}: {c}</span>
                                        ))}
                                    </span>
                                ),
                            },
                            {
                                key: 'remis', label: 'REMIS', render: (r) => (
                                    <span className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-semibold text-fg-primary tabular-nums">{r.remis_total}</span>
                                        {Object.entries(r.remis_by_status).map(([s, c]) => (
                                            <span key={s} className="rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[10px] capitalize text-fg-tertiary">{s.replace(/_/g, ' ')}: {c}</span>
                                        ))}
                                    </span>
                                ),
                            },
                            { key: 'total', label: 'Total', className: 'font-semibold text-fg-primary tabular-nums' },
                        ]}
                    />
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
