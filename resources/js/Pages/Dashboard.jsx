import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import WidgetCard from '@/Components/Dashboard/WidgetCard';
import { Head } from '@inertiajs/react';
import {
    IconStack2, IconClockPause, IconCircleCheck, IconCircleX, IconTimeDuration30,
} from '@tabler/icons-react';

export default function Dashboard({ dpoWidgets, ordWidgets, endorserWidgets, adminSummary }) {
    const hasWidgets = dpoWidgets || ordWidgets || endorserWidgets || adminSummary;

    const summaryTiles = adminSummary && [
        { label: 'Total Applications', value: adminSummary.total, icon: IconStack2 },
        { label: 'Pending Reviews', value: adminSummary.pending_reviews, icon: IconClockPause },
        { label: 'Approved', value: adminSummary.approved, icon: IconCircleCheck },
        { label: 'Disapproved', value: adminSummary.disapproved, icon: IconCircleX },
        { label: 'Avg. Processing (days)', value: adminSummary.avg_processing_days ?? '—', icon: IconTimeDuration30 },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-8 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="border-b border-border pb-6">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Workspace</p>
                        <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Dashboard</h1>
                        <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Your submissions and pending actions at a glance.</p>
                    </div>
                    {!hasWidgets && (
                        <div className="rounded-xl border border-border bg-surface-secondary p-6 text-sm text-fg-secondary shadow-resting">
                            Nothing to show yet — new submissions and pending actions will appear here.
                        </div>
                    )}

                    {/* FRS §XVII — administrator summary tiles */}
                    {summaryTiles && (
                        <section>
                            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
                                Overview
                            </h2>
                            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5">
                                {summaryTiles.map((tile) => (
                                    <StatCard key={tile.label} label={tile.label} value={tile.value} icon={tile.icon} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Academic endorsement chain — adviser / program head / dean. Shown first
                        because for an adviser this is their whole job in the system. */}
                    {endorserWidgets && (
                        <section>
                            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
                                Endorsement
                            </h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <WidgetCard title="Awaiting My Endorsement" widget={endorserWidgets.awaiting_my_endorsement} />
                                <WidgetCard title="For Revision" widget={endorserWidgets.for_revision} />
                                <WidgetCard title="Recently Endorsed (30d)" widget={endorserWidgets.recently_endorsed} />
                                {endorserWidgets.my_classes && (
                                    <WidgetCard title="My Classes" widget={endorserWidgets.my_classes} />
                                )}
                            </div>
                        </section>
                    )}

                    {dpoWidgets && (
                        <section>
                            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
                                DPO
                            </h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <WidgetCard title="New Submissions" widget={dpoWidgets.new_submissions} />
                                <WidgetCard title="Pending My Action" widget={dpoWidgets.pending_my_action} />
                                <WidgetCard title="Returned for Correction" widget={dpoWidgets.returned} />
                                <WidgetCard title="Recently Completed (30d)" widget={dpoWidgets.recently_completed} />
                            </div>
                        </section>
                    )}

                    {ordWidgets && (
                        <section>
                            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
                                ORD / Ethics
                            </h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <WidgetCard title="New Submissions" widget={ordWidgets.new_submissions} />
                                <WidgetCard title="Pending My Action" widget={ordWidgets.pending_my_action} />
                                <WidgetCard title="For Revision" widget={ordWidgets.for_revision} />
                                <WidgetCard title="Recently Completed (30d)" widget={ordWidgets.recently_completed} />
                                <WidgetCard title="Overdue Monitoring" widget={ordWidgets.overdue_monitoring} />
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
