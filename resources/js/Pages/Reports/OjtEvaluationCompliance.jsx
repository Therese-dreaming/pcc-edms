import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { ReportCard, StatCard } from '@/Components/Reports/Charts';
import { DateField, FilterBar, ReportTable, TextField } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import { IconCircleCheck, IconCircleX, IconClipboardCheck } from '@tabler/icons-react';
import { useState } from 'react';

export default function OjtEvaluationCompliance({ filters, data }) {
    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        department: filters.department ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.ojt-evaluation-compliance'), form, { preserveState: true });
    };

    const totalUploaded = data.rows.reduce((s, r) => s + r.uploaded, 0);
    const totalAll = data.rows.reduce((s, r) => s + r.total, 0);
    const rate = totalAll > 0 ? Math.round((totalUploaded / totalAll) * 100) : 0;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconClipboardCheck}
                    title="OJT Evaluation Report Compliance"
                    description="Departments' submission status for OJT trainee evaluation reports after placement ends."
                />
            }
        >
            <Head title="OJT Evaluation Report Compliance" />

            <div className="mx-auto max-w-5xl px-5 py-8 sm:px-7 lg:px-10">
                <ReportToolbar
                    csvHref={route('reports.ojt-evaluation-compliance') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <FilterBar onSubmit={submit}>
                    <DateField label="Placement ended from" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                    <DateField label="Placement ended to" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                    <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="All departments" />
                </FilterBar>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard label="Submission rate" value={`${rate}%`} icon={IconClipboardCheck} helper={`${totalUploaded} of ${totalAll} uploaded`} trendDirection={rate >= 80 ? 'up' : 'down'} />
                    <StatCard label="Compliant depts" value={data.compliant_departments.length} icon={IconCircleCheck} helper="All reports submitted" />
                    <StatCard label="Non-compliant depts" value={data.non_compliant_departments.length} icon={IconCircleX} helper="Missing submissions" />
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ReportCard icon={IconCircleCheck} title="Compliant departments">
                        <ul className="flex flex-wrap gap-2">
                            {data.compliant_departments.length === 0 && <li className="text-sm text-fg-tertiary">None</li>}
                            {data.compliant_departments.map((d) => (
                                <li key={d} className="inline-flex items-center rounded-full bg-success-bg px-3 py-1 text-xs font-medium text-success-text">{d}</li>
                            ))}
                        </ul>
                    </ReportCard>
                    <ReportCard icon={IconCircleX} title="Non-compliant departments">
                        <ul className="flex flex-wrap gap-2">
                            {data.non_compliant_departments.length === 0 && <li className="text-sm text-fg-tertiary">None</li>}
                            {data.non_compliant_departments.map((d) => (
                                <li key={d} className="inline-flex items-center rounded-full bg-danger-bg px-3 py-1 text-xs font-medium text-danger-text">{d}</li>
                            ))}
                        </ul>
                    </ReportCard>
                </div>

                <ReportCard icon={IconClipboardCheck} title="Submission detail" className="!p-0" right={<span className="text-xs text-fg-tertiary">{data.rows.length} departments</span>}>
                    <ReportTable
                        rowKey={(r) => r.department}
                        rows={data.rows}
                        empty="No placements ended in the selected range."
                        columns={[
                            { key: 'department', label: 'Department', className: 'font-medium text-fg-primary' },
                            { key: 'uploaded', label: 'Uploaded', className: 'tabular-nums text-fg-success-strong' },
                            { key: 'not_uploaded', label: 'Not uploaded', className: 'tabular-nums text-fg-danger-strong' },
                            { key: 'total', label: 'Total', className: 'font-semibold text-fg-primary tabular-nums' },
                        ]}
                    />
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
