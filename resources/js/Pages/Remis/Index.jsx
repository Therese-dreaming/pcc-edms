import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import { EmptyRow, TBody, THead, Table, Td, Th, Tr } from '@/Components/Table';
import { Head, Link, router } from '@inertiajs/react';
import { IconClock, IconFlask, IconSearch } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

const STATUS_LABELS = {
    draft_submitted: 'Draft Submitted',
    under_endorsement: 'Under Endorsement',
    for_screening: 'For Screening',
    for_revision: 'For Revision',
    for_review: 'For Review',
    approved: 'Approved',
    approved_with_conditions: 'Approved with Conditions',
    deferred: 'Deferred',
    disapproved: 'Disapproved',
    clearance_issued: 'Clearance Issued',
    monitoring: 'Monitoring',
    closed: 'Closed',
    archived: 'Archived',
};

export default function Index({ applications, filters, statusCounts = {} }) {
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const isFirstRender = useRef(true);

    const pushFilters = (next) => {
        router.get(
            route('remis.index'),
            { search: next.search ?? searchQuery, status: next.status ?? statusFilter },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => pushFilters({ search: searchQuery }), 350);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const setStatus = (status) => {
        setStatusFilter(status);
        pushFilters({ status });
    };

    const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconFlask}
                    title="REMIS Applications"
                    description="Research ethics applications and their review/monitoring status."
                />
            }
        >
            <Head title="REMIS Applications" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative sm:max-w-xs sm:flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <IconSearch size={16} className="text-zinc-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search tracking # or title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                            />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setStatus('all')}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                    statusFilter === 'all'
                                        ? 'border-primary-200 bg-primary-50 text-primary-900'
                                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                                }`}
                            >
                                All
                                <span className="text-zinc-400">{totalCount}</span>
                            </button>
                            {Object.entries(STATUS_LABELS).filter(([key]) => statusCounts[key]).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setStatus(key)}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                        statusFilter === key
                                            ? 'border-primary-200 bg-primary-50 text-primary-900'
                                            : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                                    }`}
                                >
                                    {label}
                                    <span className="text-zinc-400">{statusCounts[key]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Table>
                        <THead>
                            <Tr>
                                <Th>Tracking #</Th>
                                <Th>Study Title</Th>
                                <Th>Status</Th>
                                <Th>Created</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {applications.data.length === 0 && (
                                <EmptyRow colSpan={4}>
                                    {totalCount === 0
                                        ? 'No applications yet — submitted via Form 1 under DPREQ.'
                                        : 'No matching applications. Try adjusting your search or filter.'}
                                </EmptyRow>
                            )}
                            {applications.data.map((application) => (
                                <Tr key={application.id}>
                                    <Td>
                                        <Link
                                            href={route('remis.show', application.id)}
                                            className="group inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-primary-700"
                                        >
                                            <IconFlask size={14} className="text-zinc-400 group-hover:text-primary-600" strokeWidth={2} />
                                            {application.tracking_number}
                                        </Link>
                                    </Td>
                                    <Td>
                                        <Link
                                            href={route('remis.show', application.id)}
                                            className="font-medium text-zinc-900 transition-colors hover:text-primary-700"
                                        >
                                            {application.research_application?.research_title}
                                        </Link>
                                    </Td>
                                    <Td>
                                        <StatusBadge status={application.status} label={STATUS_LABELS[application.status]} />
                                    </Td>
                                    <Td>
                                        {application.created_at && (
                                            <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                                                <IconClock size={14} className="text-zinc-400" />
                                                {new Date(application.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>

                    <Pagination paginator={applications} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
