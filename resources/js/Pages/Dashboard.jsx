import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import WidgetCard from '@/Components/Dashboard/WidgetCard';
import { Head } from '@inertiajs/react';
import { IconLayoutDashboard } from '@tabler/icons-react';

export default function Dashboard({ dpoWidgets, ordWidgets }) {
    const hasWidgets = dpoWidgets || ordWidgets;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconLayoutDashboard}
                    title="Dashboard"
                    description="Your submissions and pending actions at a glance."
                />
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-8 sm:px-6 lg:px-8">
                    {!hasWidgets && (
                        <div className="rounded-lg border border-zinc-200 bg-white">
                            <div className="p-6 text-zinc-600">
                                Nothing to show yet — new submissions and pending actions will appear here.
                            </div>
                        </div>
                    )}

                    {dpoWidgets && (
                        <section>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-700">
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
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-700">
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
