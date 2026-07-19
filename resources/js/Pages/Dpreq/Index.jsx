import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import { Head, Link, router } from '@inertiajs/react';
import {
    IconClock,
    IconPlus,
    IconSearch,
    IconShieldLock,
    IconX,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

const STATUS_LABELS = {
    draft: 'Draft',
    submitted: 'Submitted',
    screening: 'Screening',
    returned: 'Returned',
    under_review: 'Under review',
    endorsed: 'Endorsed',
    rejected: 'Rejected',
    approved: 'Approved',
    clearance_issued: 'Clearance issued',
};

const STATUS_ORDER = [
    'submitted',
    'screening',
    'under_review',
    'endorsed',
    'returned',
    'draft',
    'approved',
    'clearance_issued',
    'rejected',
];

const REVIEW_STATUSES = [
    'screening',
    'under_review',
];

const CLEARED_STATUSES = [
    'approved',
    'clearance_issued',
];

const SEGMENTS = {
    submitted: 'bg-primary-300',
    screening: 'bg-primary-400',
    under_review: 'bg-primary-500',
    endorsed: 'bg-primary-600',
    approved: 'bg-primary-700',
    clearance_issued: 'bg-primary-800',
    draft: 'bg-paper-300',
    returned: 'bg-paper-400',
    rejected: 'bg-paper-500',
};

// Helper function to get status label
const labelFor = (status) => STATUS_LABELS[status] || status;

// Helper function to get application title
const titleFor = (application) => 
    application.research_application?.research_title || 
    `Application ${application.tracking_number}` || 
    'Untitled Application';

// Helper function to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

export default function Index({
    applications,
    filters,
    statusCounts = {},
}) {
    const [searchQuery, setSearchQuery] = useState(
        filters?.search ?? ''
    );

    const [statusFilter, setStatusFilter] = useState(
        filters?.status ?? 'all'
    );

    const firstRender = useRef(true);

    const visibleStatuses = [
        ...STATUS_ORDER.filter((status) => statusCounts[status]),
        ...Object.keys(statusCounts).filter(
            (status) => !STATUS_ORDER.includes(status)
        ),
    ];

    const totalCount = Object.values(statusCounts).reduce(
        (sum, count) => sum + count,
        0
    );

    const sumOf = (keys) =>
        keys.reduce(
            (sum, key) => sum + (statusCounts[key] || 0),
            0
        );

    const inReview = sumOf(REVIEW_STATUSES);
    const cleared = sumOf(CLEARED_STATUSES);

    const otherOpen = Math.max(
        totalCount - inReview - cleared,
        0
    );

    const hasFilters =
        (filters?.search ?? '') !== '' ||
        (filters?.status ?? 'all') !== 'all';

    const pushFilters = (next) =>
        router.get(
            route('dpreq.index'),
            {
                search: next.search ?? searchQuery,
                status: next.status ?? statusFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return undefined;
        }

        const timeout = setTimeout(() => {
            pushFilters({
                search: searchQuery,
            });
        }, 350);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const setStatus = (status) => {
        setStatusFilter(status);
        pushFilters({ status });
    };

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');

        router.get(
            route('dpreq.index'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="DPREQ applications" />

            <div className="px-5 py-8 font-grotesk text-paper-900 sm:px-8 lg:px-12 lg:py-10">
                <div className="mx-auto max-w-[90rem]">

                    {/* Header */}
                    <section className="flex flex-col items-start justify-between gap-6 sm:flex-row">
                        <div className="flex items-start gap-3.5">
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-primary-800 text-white shadow-lg shadow-primary-900/20">
                                <IconShieldLock size={22} />
                            </span>

                            <div>
                                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.11em] text-primary-700">
                                    Privacy operations
                                </p>

                                <h1 className="text-3xl font-extrabold leading-none tracking-[-0.045em] lg:text-5xl">
                                    DPREQ applications
                                </h1>

                                <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-paper-600">
                                    Track data privacy requests from
                                    submission to clearance.
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('dpreq.create')}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-800 px-4 text-sm font-bold text-white shadow-lg shadow-primary-900/15 hover:bg-primary-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20"
                        >
                            <IconPlus size={18} />
                            New application
                        </Link>
                    </section>

                    {/* Summary */}
                    <section className="mt-8 border-t border-paper-200 pt-5">
                        <div className="flex flex-wrap items-baseline">
                            {[
                                ['Total', totalCount],
                                ['In review', inReview],
                                ['Cleared', cleared],
                                ['Other open', otherOpen],
                            ].map(([label, value], index) => (
                                <div
                                    key={label}
                                    className={`flex items-baseline gap-2 pr-6 ${
                                        index
                                            ? 'border-l border-paper-200 pl-6'
                                            : ''
                                    }`}
                                >
                                    <strong className="text-[1.4rem] font-extrabold tabular-nums tracking-[-0.03em]">
                                        {value.toLocaleString()}
                                    </strong>

                                    <span className="text-xs font-semibold text-paper-500">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {totalCount > 0 && (
                            <div
                                className="mt-5 flex h-3 gap-0.5"
                                role="group"
                                aria-label="Applications by status"
                            >
                                {visibleStatuses.map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        title={`${labelFor(status)} · ${statusCounts[status]}`}
                                        onClick={() =>
                                            setStatus(
                                                statusFilter === status
                                                    ? 'all'
                                                    : status
                                            )
                                        }
                                        className={`
                                            h-full
                                            rounded-[2px]
                                            transition-transform
                                            hover:scale-y-125
                                            ${
                                                SEGMENTS[status] ||
                                                'bg-paper-400'
                                            }
                                            ${
                                                statusFilter !== 'all' &&
                                                statusFilter !== status
                                                    ? 'opacity-25'
                                                    : ''
                                            }
                                        `}
                                        style={{
                                            width: `${
                                                (statusCounts[status] /
                                                    totalCount) *
                                                100
                                            }%`,
                                        }}
                                        aria-label={`${labelFor(status)}: ${statusCounts[status]}`}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                                        {/* Search & Filters */}
                    <section className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <label className="relative block w-full lg:max-w-sm">
                            <span className="sr-only">
                                Search applications
                            </span>

                            <IconSearch
                                size={17}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-paper-400"
                            />

                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Search tracking number or title"
                                className="min-h-11 w-full rounded-lg border border-paper-200 bg-white py-2 pl-10 pr-3 text-sm outline-none placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                            />
                        </label>

                        <div className="flex flex-wrap gap-1 rounded-xl bg-paper-100 p-1">

                            <button
                                type="button"
                                onClick={() => setStatus('all')}
                                className={`min-h-9 rounded-lg px-3 text-xs font-bold ${
                                    statusFilter === 'all'
                                        ? 'bg-primary-800 text-white shadow-sm'
                                        : 'text-paper-500 hover:bg-white'
                                }`}
                            >
                                All
                                <span className="ml-1 opacity-60">
                                    {totalCount}
                                </span>
                            </button>

                            {visibleStatuses.map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatus(status)}
                                    className={`min-h-9 rounded-lg px-3 text-xs font-bold ${
                                        statusFilter === status
                                            ? 'bg-primary-800 text-white shadow-sm'
                                            : 'text-paper-500 hover:bg-white'
                                    }`}
                                >
                                    {labelFor(status)}

                                    <span className="ml-1 opacity-60">
                                        {statusCounts[status]}
                                    </span>
                                </button>
                            ))}

                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-bold text-paper-500 hover:bg-white"
                                >
                                    <IconX size={14} />
                                    Clear
                                </button>
                            )}

                        </div>
                    </section>

                    {/* Desktop Table */}
                    <div className="mt-5 hidden overflow-hidden rounded-xl border border-paper-200 bg-white md:block">

                        <table className="w-full border-collapse text-[0.8125rem]">

                            <thead>
                                <tr>
                                    {[
                                        'Tracking #',
                                        'Research title',
                                        'Status',
                                        'Created',
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            className="border-b border-paper-200 px-5 py-3 text-left text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-paper-400"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>

                                {applications.data.length === 0 ? (

                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center text-sm text-paper-400"
                                        >
                                            {totalCount === 0
                                                ? 'No applications yet. Create the first one to get moving.'
                                                : 'No matching applications. Clear the filters and try again.'}
                                        </td>
                                    </tr>

                                ) : (

                                    applications.data.map((application) => (
                                        <tr
                                            key={application.id}
                                            className="border-b border-paper-100 last:border-0 hover:bg-primary-50/40"
                                        >

                                            <td className="px-5 py-3">
                                                <Link
                                                    href={route(
                                                        'dpreq.show',
                                                        application.id
                                                    )}
                                                    className="group inline-flex items-center gap-2 font-bold tabular-nums hover:text-primary-700"
                                                >
                                                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-paper-100 text-paper-400 group-hover:bg-primary-50 group-hover:text-primary-700">
                                                        <IconShieldLock size={15} />
                                                    </span>

                                                    {application.tracking_number ||
                                                        'No tracking #'}
                                                </Link>
                                            </td>

                                            <td className="px-5 py-3">
                                                <Link
                                                    href={route(
                                                        'dpreq.show',
                                                        application.id
                                                    )}
                                                    className="line-clamp-2 max-w-2xl font-semibold text-paper-700 hover:text-primary-700"
                                                >
                                                    {titleFor(application)}
                                                </Link>
                                            </td>

                                            <td className="px-5 py-3">
                                                <StatusBadge
                                                    status={application.status}
                                                    label={labelFor(
                                                        application.status
                                                    )}
                                                />
                                            </td>

                                            <td className="px-5 py-3">
                                                <span className="flex items-center gap-1.5 tabular-nums text-paper-400">
                                                    <IconClock size={14} />
                                                    {formatDate(
                                                        application.created_at
                                                    )}
                                                </span>
                                            </td>

                                        </tr>
                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                                        {/* Mobile Cards */}
                    <div className="space-y-3 md:hidden">

                        {applications.data.length === 0 ? (

                            <div className="rounded-xl border border-dashed border-paper-300 bg-white px-5 py-9 text-center text-sm text-paper-400">
                                {totalCount === 0
                                    ? 'No applications yet. Create the first one to get moving.'
                                    : 'No matching applications. Clear the filters and try again.'}
                            </div>

                        ) : (

                            applications.data.map((application) => (
                                <Link
                                    key={application.id}
                                    href={route(
                                        'dpreq.show',
                                        application.id
                                    )}
                                    className="block rounded-xl border border-paper-200 bg-white p-4 shadow-sm hover:border-primary-200"
                                >
                                    <div className="flex items-start justify-between gap-3">

                                        <div>
                                            <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-paper-400">
                                                {application.tracking_number ||
                                                    'No tracking #'}
                                            </p>

                                            <h2 className="mt-1 line-clamp-2 font-bold leading-snug">
                                                {titleFor(application)}
                                            </h2>
                                        </div>

                                        <StatusBadge
                                            status={application.status}
                                            label={labelFor(application.status)}
                                        />

                                    </div>

                                    <p className="mt-3 flex items-center gap-1.5 text-xs tabular-nums text-paper-400">
                                        <IconClock size={14} />
                                        {formatDate(application.created_at)}
                                    </p>

                                </Link>
                            ))

                        )}

                    </div>

                    {/* Pagination */}
                    <Pagination paginator={applications} />

                </div>
            </div>
        </AuthenticatedLayout>
    );
}