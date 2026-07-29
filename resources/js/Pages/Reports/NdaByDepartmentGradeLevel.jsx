import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { ColumnChart, ReportCard, StatCard } from '@/Components/Reports/Charts';
import { DateField, FilterBar } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import { IconBuildingBank, IconFileCertificate } from '@tabler/icons-react';
import { useState } from 'react';

export default function NdaByDepartmentGradeLevel({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.nda-by-department-grade-level'), form, { preserveState: true });
    };

    const byDept = Object.fromEntries(data.rows.map((r) => [r.department, r.total]));

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconFileCertificate}
                    title="Accomplished NDAs by Department and Grade Level"
                    description="Completed non-disclosure agreements cross-tabulated by host department and trainee grade level."
                />
            }
        >
            <Head title="NDAs by Department and Grade Level" />

            <div className="mx-auto max-w-5xl px-5 py-8 sm:px-7 lg:px-10">
                <ReportToolbar
                    csvHref={route('reports.nda-by-department-grade-level') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <FilterBar onSubmit={submit}>
                    <DateField label="Signed from" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                    <DateField label="Signed to" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                </FilterBar>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <StatCard label="Completed NDAs" value={data.grand_total} icon={IconFileCertificate} helper="Matching current filters" />
                    <StatCard label="Departments" value={data.rows.length} icon={IconBuildingBank} helper={`Across ${data.levels.length} grade levels`} />
                </div>

                {data.rows.length > 0 && (
                    <div className="mb-6">
                        <ReportCard icon={IconBuildingBank} title="NDAs per department">
                            <ColumnChart counts={byDept} />
                        </ReportCard>
                    </div>
                )}

                <ReportCard icon={IconFileCertificate} title="Cross-tabulation" className="!p-0" right={<span className="text-xs text-fg-tertiary">{data.rows.length} departments</span>}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-tertiary">Host department</th>
                                    {data.levels.map((level) => (
                                        <th key={level} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-tertiary">{level}</th>
                                    ))}
                                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-tertiary">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={data.levels.length + 2} className="px-5 py-10 text-center text-sm text-fg-tertiary">No completed NDAs for the selected filters.</td>
                                    </tr>
                                ) : (
                                    data.rows.map((row) => (
                                        <tr key={row.department} className="border-b border-border last:border-0 hover:bg-surface-tertiary/50">
                                            <td className="px-5 py-3.5 text-sm font-medium text-fg-primary">{row.department}</td>
                                            {data.levels.map((level) => (
                                                <td key={level} className="px-5 py-3.5 text-sm tabular-nums text-fg-secondary">{row.counts[level] ?? 0}</td>
                                            ))}
                                            <td className="px-5 py-3.5 text-sm font-semibold tabular-nums text-fg-primary">{row.total}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {data.rows.length > 0 && (
                                <tfoot>
                                    <tr className="border-t border-border bg-surface-tertiary/60">
                                        <td className="px-5 py-3 text-sm font-semibold text-fg-primary">Grand total</td>
                                        <td colSpan={data.levels.length} />
                                        <td className="px-5 py-3 text-sm font-semibold tabular-nums text-primary">{data.grand_total}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
