import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    IconAlertTriangle, IconArrowRight, IconBuildingBank, IconCalendarStats, IconChartBar,
    IconClipboardCheck, IconClipboardList, IconClockHour4, IconFileCertificate, IconMapPin,
    IconShieldCheck, IconUsersGroup, IconArchive,
} from '@tabler/icons-react';

// Reports landing — redesign system (.claude/skills/redesign): light surfaces, rounded cards,
// dark-red accent on icon tiles + the hover arrow. Reports are grouped into the same three
// buckets the backend uses (Shared / Ethics-ORD / DPO) so the catalogue reads at a glance.

// Per-report presentation: icon + one-line description + which group it belongs to.
const REPORT_META = {
    'reports.applications-by-department': { icon: IconBuildingBank, group: 'shared', desc: 'DPREQ + REMIS volume broken down by department.' },
    'reports.incident-summary': { icon: IconAlertTriangle, group: 'shared', desc: 'Reported incidents by type, severity and status.' },
    'reports.compliance-monitoring': { icon: IconClipboardCheck, group: 'shared', desc: 'Monitoring compliance across approved studies.' },
    'reports.risk-level': { icon: IconShieldCheck, group: 'ethics', desc: 'Applications grouped by assessed risk classification.' },
    'reports.reviewer-workload': { icon: IconUsersGroup, group: 'ethics', desc: 'Active review assignments per committee member.' },
    'reports.annual-ethics': { icon: IconCalendarStats, group: 'ethics', desc: 'Year-over-year ethics review activity summary.' },
    'reports.archive-studies': { icon: IconArchive, group: 'ethics', desc: 'Closed and archived studies register.' },
    'reports.nda-by-department-grade-level': { icon: IconFileCertificate, group: 'dpo', desc: 'Signed NDAs by department and grade level.' },
    'reports.pending-dpo-approvals': { icon: IconClockHour4, group: 'dpo', desc: 'DPREQ requests still awaiting a DPO decision.' },
    'reports.ojt-accommodated': { icon: IconUsersGroup, group: 'dpo', desc: 'OJT trainees accommodated per department.' },
    'reports.whereabouts': { icon: IconMapPin, group: 'dpo', desc: 'Current placement whereabouts of trainees.' },
    'reports.ojt-evaluation-compliance': { icon: IconClipboardList, group: 'dpo', desc: 'OJT evaluation report submission compliance.' },
};

const GROUPS = [
    { key: 'shared', label: 'Shared', hint: 'Cross-office compliance & volume' },
    { key: 'ethics', label: 'Ethics · ORD', hint: 'Research ethics review reporting' },
    { key: 'dpo', label: 'Data Privacy · DPO', hint: 'Data-privacy & OJT reporting' },
];

function ReportCard({ report }) {
    const meta = REPORT_META[report.route] ?? { icon: IconChartBar, desc: 'Generate and export this report.' };
    const Icon = meta.icon;
    return (
        <Link
            href={route(report.route)}
            className="group flex items-start gap-4 rounded-xl border border-border bg-surface-primary p-5 shadow-resting transition-colors hover:border-primary hover:bg-surface-tertiary"
        >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon size={22} strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-fg-primary">
                    {report.name}
                    <IconArrowRight size={15} className="shrink-0 text-fg-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-fg-tertiary">{meta.desc}</span>
            </span>
        </Link>
    );
}

export default function Index({ reports }) {
    const grouped = GROUPS
        .map((g) => ({ ...g, items: reports.filter((r) => (REPORT_META[r.route]?.group ?? 'shared') === g.key) }))
        .filter((g) => g.items.length > 0);

    return (
        <AuthenticatedLayout>
            <Head title="Reports" />

            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10">
                {/* Header — typographic, no icon */}
                <div className="mb-8 border-b border-border pb-6">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Workspace</p>
                    <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Reports</h1>
                    <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Compliance and workload reports available to your role.</p>
                </div>
                {reports.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border-medium bg-surface-primary p-12 text-center">
                        <IconChartBar size={36} className="mx-auto text-border-medium" />
                        <p className="mt-3 text-sm font-medium text-fg-secondary">No reports available for your role.</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {grouped.map((group) => (
                            <section key={group.key}>
                                <div className="mb-3 flex items-baseline justify-between">
                                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-tertiary">{group.label}</h2>
                                    <span className="text-xs text-fg-tertiary">{group.hint}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {group.items.map((report) => <ReportCard key={report.route} report={report} />)}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
