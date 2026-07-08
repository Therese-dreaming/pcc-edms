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
    under_review: 'Under Review',
    endorsed: 'Endorsed',
    rejected: 'Rejected',
    approved: 'Approved',
    clearance_issued: 'Clearance Issued',
};

// Workflow order, not alphabetical. This is how applications actually move.
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

// Pipeline segment color per status â€” all primary shades, with stone for
// not-started / kicked-back / closed-negative states. No indigo hardcoding.
const STATUS_SEGMENT = {
    submitted: 'bg-primary-300',
    screening: 'bg-primary-400',
    under_review: 'bg-primary-500',
    endorsed: 'bg-primary-600',
    approved: 'bg-primary-700',
    clearance_issued: 'bg-primary-800',
    draft: 'bg-stone-300',
    returned: 'bg-stone-400',
    rejected: 'bg-stone-500',
};

const REVIEW_STATUSES = ['screening', 'under_review'];
const CLEARED_STATUSES = ['approved', 'clearance_issued'];

function formatDate(date) {
    if (!date) return 'No date';

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getResearchTitle(application) {
    return application.research_application?.research_title || 'Untitled Application';
}

function getStatusLabel(status) {
    return STATUS_LABELS[status] || status?.replaceAll('_', ' ') || 'Unknown';
}

export default function Index({ applications, filters, statusCounts = {} }) {
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const isFirstRender = useRef(true);

    const pushFilters = (next) => {
        router.get(
            route('dpreq.index'),
            { search: next.search ?? searchQuery, status: next.status ?? statusFilter },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    // Debounced server-side search â€” every keystroke would round-trip otherwise.
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

    // Click a status to filter; click the active one again to clear it.
    const toggleStatus = (status) => {
        setStatus(statusFilter === status ? 'all' : status);
    };

    const hasFilters =
        (filters?.search ?? '') !== '' || (filters?.status ?? 'all') !== 'all';

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        router.get(route('dpreq.index'), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const visibleStatuses = [
        ...STATUS_ORDER.filter((status) => statusCounts[status]),
        ...Object.keys(statusCounts).filter((status) => !STATUS_ORDER.includes(status)),
    ];

    const sumOf = (keys) => keys.reduce((sum, key) => sum + (statusCounts[key] || 0), 0);

    const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const inReviewCount = sumOf(REVIEW_STATUSES);
    const clearedCount = sumOf(CLEARED_STATUSES);
    const otherOpenCount = Math.max(totalCount - inReviewCount - clearedCount, 0);

    const pct = (value) => (totalCount > 0 ? (value / totalCount) * 100 : 0);

    const metrics = [
        { label: 'Total', value: totalCount },
        { label: 'In review', value: inReviewCount },
        { label: 'Cleared', value: clearedCount },
        { label: 'Other open', value: otherOpenCount },
    ];

    const filterActive = statusFilter !== 'all';

    return (
        <AuthenticatedLayout>
            <Head title="DPREQ Applications" />

            <div className="py-8 font-grotesk text-stone-900 [font-optical-sizing:auto]">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Console: header + interactive overview */}
                    <section>
                        {/* Header row */}
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div className="flex items-start gap-3.5">
                                <span className="flex size-11 flex-none items-center justify-center rounded-[13px] bg-primary-700 text-white shadow-lg shadow-primary-700/30">
                                    <IconShieldLock size={22} strokeWidth={2} />
                                </span>
                                <div>
                                    <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-stone-900">
                                        DPREQ Applications
                                    </h1>
                                    <p className="mt-1 max-w-[46ch] text-[0.8125rem] leading-relaxed text-stone-500">
                                        Track data privacy requests from submission to clearance.
                                    </p>
                                </div>
                            </div>

                            <Link
                                href={route('dpreq.create')}
                                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-primary-700 px-4 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:translate-y-px"
                            >
                                <IconPlus size={18} strokeWidth={2.5} />
                                New Application
                            </Link>
                        </div>

                        {/* Overview: inline metrics + interactive pipeline bar */}
                        <div className="mt-5 flex flex-col gap-3.5 border-t border-stone-200 pt-5">
                            <div className="flex flex-wrap items-baseline">
                                {metrics.map((metric, index) => (
                                    <div
                                        key={metric.label}
                                        className={`flex items-baseline gap-2 pr-6 ${
                                            index > 0 ? 'border-l border-stone-200 pl-6' : ''
                                        }`}
                                    >
                                        <span className="text-[1.375rem] font-bold tabular-nums tracking-[-0.02em]">
                                            {metric.value.toLocaleString()}
                                        </span>
                                        <span className="text-xs font-medium text-stone-500">
                                            {metric.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {totalCount > 0 && (
                                <div
                                    className={`group flex h-3 w-full gap-0.5 ${
                                        filterActive ? 'is-filtered' : ''
                                    }`}
                                    role="group"
                                    aria-label="Applications by status. Select a segment to filter."
                                >
                                    {visibleStatuses.map((status) => {
                                        const isActive = statusFilter === status;
                                        return (
                                            <button
                                                type="button"
                                                key={status}
                                                onClick={() => toggleStatus(status)}
                                                title={`${getStatusLabel(status)} Â· ${statusCounts[status]}`}
                                                aria-label={`${getStatusLabel(status)}: ${statusCounts[status]}. ${
                                                    isActive ? 'Selected, click to clear.' : 'Click to filter.'
                                                }`}
                                                aria-pressed={isActive}
                                                style={{ width: `${pct(statusCounts[status])}%` }}
                                                className={`h-full origin-center cursor-pointer rounded-[2px] transition duration-150 ease-out first:rounded-l-full last:rounded-r-full hover:scale-y-[1.35] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 ${
                                                    STATUS_SEGMENT[status] || 'bg-stone-400'
                                                } ${
                                                    filterActive && !isActive ? 'opacity-30' : 'opacity-100'
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Controls */}
                    <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <IconSearch size={17} className="text-stone-400" />
                            </div>

                            <input
                                type="search"
                                placeholder="Search tracking number or title"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="block min-h-[42px] w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-[0.8125rem] text-stone-900 placeholder-stone-400 shadow-sm transition focus:border-primary-600 focus:outline-none focus:ring-[3px] focus:ring-primary-600/15"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-stone-100/70 p-1">
                            <button
                                type="button"
                                onClick={() => setStatus('all')}
                                className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-[0.8125rem] font-medium transition-colors duration-150 ${
                                    statusFilter === 'all'
                                        ? 'bg-primary-700 text-white shadow-sm'
                                        : 'text-stone-500 hover:bg-white hover:text-stone-900 hover:shadow-sm'
                                }`}
                            >
                                All
                                <span
                                    className={`tabular-nums ${
                                        statusFilter === 'all' ? 'text-white/70' : 'text-stone-400'
                                    }`}
                                >
                                    {totalCount}
                                </span>
                            </button>

                            {visibleStatuses.map((status) => (
                                <button
                                    type="button"
                                    key={status}
                                    onClick={() => setStatus(status)}
                                    className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-[0.8125rem] font-medium transition-colors duration-150 ${
                                        statusFilter === status
                                            ? 'bg-primary-700 text-white shadow-sm'
                                            : 'text-stone-500 hover:bg-white hover:text-stone-900 hover:shadow-sm'
                                    }`}
                                >
                                    {getStatusLabel(status)}
                                    <span
                                        className={`tabular-nums ${
                                            statusFilter === status ? 'text-white/70' : 'text-stone-400'
                                        }`}
                                    >
                                        {statusCounts[status]}
                                    </span>
                                </button>
                            ))}

                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-[0.8125rem] font-medium text-stone-500 transition-colors duration-150 hover:bg-white hover:text-stone-900 hover:shadow-sm"
                                >
                                    <IconX size={14} />
                                    Clear
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Desktop table */}
                    <div className="hidden overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(41,37,36,0.04),0_8px_24px_-12px_rgba(41,37,36,0.10)] md:block">
                        <table className="w-full border-collapse text-[0.8125rem]">
                            <thead>
                                <tr>
                                    <th className="border-b border-stone-200 px-5 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-stone-400">
                                        Tracking #
                                    </th>
                                    <th className="border-b border-stone-200 px-5 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-stone-400">
                                        Research Title
                                    </th>
                                    <th className="border-b border-stone-200 px-5 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-stone-400">
                                        Status
                                    </th>
                                    <th className="border-b border-stone-200 px-5 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-stone-400">
                                        Created
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {applications.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-10 text-center text-[0.8125rem] text-stone-400"
                                        >
                                            {totalCount === 0
                                                ? 'No applications yet. Create the first one to get moving.'
                                                : 'No matching applications. Clear the filters and try again.'}
                                        </td>
                                    </tr>
                                )}

                                {applications.data.map((application) => (
                                    <tr
                                        key={application.id}
                                        className="border-b border-stone-100 transition-colors duration-150 last:border-b-0 hover:bg-stone-50/60"
                                    >
                                        <td className="px-5 py-3">
                                            <Link
                                                href={route('dpreq.show', application.id)}
                                                className="group inline-flex items-center gap-2 font-semibold tabular-nums text-stone-900 transition-colors hover:text-primary-700"
                                            >
                                                <span className="flex size-7 items-center justify-center rounded-lg bg-stone-100 text-stone-400 transition-colors group-hover:bg-primary-50 group-hover:text-primary-700">
                                                    <IconShieldLock size={15} strokeWidth={2} />
                                                </span>
                                                {application.tracking_number || 'No tracking #'}
                                            </Link>
                                        </td>

                                        <td className="px-5 py-3">
                                            <Link
                                                href={route('dpreq.show', application.id)}
                                                className="line-clamp-2 max-w-2xl font-medium text-stone-700 transition-colors hover:text-primary-700"
                                            >
                                                {getResearchTitle(application)}
                                            </Link>
                                        </td>

                                        <td className="px-5 py-3">
                                            <StatusBadge
                                                status={application.status}
                                                label={getStatusLabel(application.status)}
                                            />
                                        </td>

                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5 tabular-nums text-stone-400">
                                                <IconClock size={14} className="text-stone-300" />
                                                {formatDate(application.created_at)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="space-y-3 md:hidden">
                        {applications.data.length === 0 ? (
                            <div className="rounded-[18px] border border-dashed border-stone-300 bg-white px-5 py-8 text-center text-[0.8125rem] text-stone-400">
                                {totalCount === 0
                                    ? 'No applications yet. Create the first one to get moving.'
                                    : 'No matching applications. Clear the filters and try again.'}
                            </div>
                        ) : (
                            applications.data.map((application) => (
                                <Link
                                    key={application.id}
                                    href={route('dpreq.show', application.id)}
                                    className="block rounded-[18px] border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(41,37,36,0.04),0_8px_24px_-12px_rgba(41,37,36,0.10)] transition-colors hover:border-primary-200"
                                >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-stone-400 tabular-nums">
                                                {application.tracking_number || 'No tracking #'}
                                            </p>
                                            <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-stone-900">
                                                {getResearchTitle(application)}
                                            </h3>
                                        </div>

                                        <StatusBadge
                                            status={application.status}
                                            label={getStatusLabel(application.status)}
                                        />
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[0.8125rem] tabular-nums text-stone-400">
                                        <IconClock size={14} className="text-stone-300" />
                                        {formatDate(application.created_at)}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    <Pagination paginator={applications} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}