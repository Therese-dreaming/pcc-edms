import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ReportToolbar from '@/Components/Reports/ReportToolbar';
import { ReportCard, StatCard } from '@/Components/Reports/Charts';
import { DateField, FilterBar, ReportTable, TextField } from '@/Components/Reports/ReportFilters';
import { Head, router } from '@inertiajs/react';
import { IconAlertTriangle, IconBuildingCommunity, IconMapPin } from '@tabler/icons-react';
import { useState } from 'react';

export default function Whereabouts({ filters, data }) {
    const [form, setForm] = useState({
        as_of: data.as_of ?? '',
        department_assigned: filters.department_assigned ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('reports.whereabouts'), form, { preserveState: true });
    };

    const departments = new Set(data.rows.map((r) => r.department_assigned)).size;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconMapPin}
                    title="Trainee Whereabouts"
                    description="Snapshot of trainees expected on-site for a given date, by department and school."
                />
            }
        >
            <Head title="Trainee Whereabouts" />

            <div className="mx-auto max-w-5xl px-5 py-8 sm:px-7 lg:px-10">
                <ReportToolbar
                    csvHref={route('reports.whereabouts') + '?format=csv&' + new URLSearchParams(form).toString()}
                />

                <div className="mb-6 flex items-start gap-2 rounded-xl border border-warning bg-warning-bg p-3.5 text-sm text-warning-text">
                    <IconAlertTriangle size={17} className="mt-0.5 shrink-0" />
                    <p>This is a placement-schedule snapshot ("on-site expected" as of the selected date), not a real-time location/attendance check-in.</p>
                </div>

                <FilterBar onSubmit={submit}>
                    <DateField label="As of" value={form.as_of} onChange={(e) => setForm({ ...form, as_of: e.target.value })} />
                    <TextField label="Department" value={form.department_assigned} onChange={(e) => setForm({ ...form, department_assigned: e.target.value })} placeholder="All departments" />
                </FilterBar>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <StatCard label="On-site expected" value={data.total} icon={IconMapPin} helper={`As of ${data.as_of}`} />
                    <StatCard label="Departments" value={departments} icon={IconBuildingCommunity} helper="Hosting trainees" />
                </div>

                <ReportCard icon={IconMapPin} title="On-site trainees" className="!p-0" right={<span className="text-xs text-fg-tertiary">{data.rows.length} rows</span>}>
                    <ReportTable
                        rows={data.rows}
                        empty="No trainees on-site as of the selected date."
                        columns={[
                            { key: 'trainee', label: 'Trainee', className: 'font-medium text-fg-primary' },
                            { key: 'trainee_type', label: 'Type', render: (r) => <span className="capitalize">{String(r.trainee_type).replace(/_/g, ' ')}</span> },
                            { key: 'department_assigned', label: 'Department' },
                            { key: 'enrolled_school', label: 'School' },
                            { key: 'period', label: 'Placement period', className: 'tabular-nums text-fg-tertiary', render: (r) => `${r.start_date} – ${r.end_date}` },
                        ]}
                    />
                </ReportCard>
            </div>
        </AuthenticatedLayout>
    );
}
