import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import WidgetCard from '@/Components/Dashboard/WidgetCard';
import { Head } from '@inertiajs/react';

export default function Dashboard({ dpoWidgets, ordWidgets }) {
    const hasWidgets = dpoWidgets || ordWidgets;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-8 sm:px-6 lg:px-8">
                    {!hasWidgets && (
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                You're logged in!
                            </div>
                        </div>
                    )}

                    {dpoWidgets && (
                        <section>
                            <h2 className="mb-3 text-lg font-semibold text-gray-800">DPO</h2>
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
                            <h2 className="mb-3 text-lg font-semibold text-gray-800">ORD / Ethics</h2>
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
