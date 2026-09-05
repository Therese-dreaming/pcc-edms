import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import Popover from '@/Components/Popover';
import StatusBadge from '@/Components/StatusBadge';
import { confirmAction, confirmDanger, notifySuccess } from '@/lib/confirm';
import { Head, Link, router } from '@inertiajs/react';
import {
    IconArchive,
    IconArrowUpRight,
    IconCheck,
    IconEyeOff,
    IconFilter,
    IconPlus,
    IconSearch,
    IconSortDescending,
    IconTrash,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

// Columns that can be shown/hidden via the "Hide fields" menu. The checkbox and the row-open
// action columns are fixed and not listed here.
const COLUMNS = [
    { key: 'tracking', label: 'Tracking #' },
    { key: 'title', label: 'Research title' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created at' },
];


const STATUS_LABELS = {
    draft: 'Draft',
    submitted: 'Submitted',
    returned: 'Returned',
    under_review: 'Under review',
    rejected: 'Rejected',
    approved: 'Approved',
    clearance_issued: 'Clearance issued',
};

const STATUS_ORDER = [
    'submitted',
    'under_review',
    'returned',
    'draft',
    'approved',
    'clearance_issued',
    'rejected',
];

const REVIEW_STATUSES = [
    'under_review',
];

const CLEARED_STATUSES = [
    'approved',
    'clearance_issued',
];

// Helper function to get status label
const labelFor = (status) => STATUS_LABELS[status] || status;

// Helper function to get application title
const titleFor = (application) =>
    application.research_application?.research_title ||
    `Application ${application.tracking_number}` ||
    'Untitled Application';

// Helper function to get department
const departmentFor = (application) =>
    application.research_application?.department ||
    application.department ||
    '';

// Helper function to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });
};

export default function Index({
    applications,
    filters,
    statusCounts = {},
    stats = {},
}) {
    const [searchQuery, setSearchQuery] = useState(
        filters?.search ?? ''
    );

    const [statusFilter, setStatusFilter] = useState(
        filters?.status ?? 'all'
    );

    const [sortOrder, setSortOrder] = useState(
        filters?.sort ?? 'newest'
    );

    // Row selection (for the Actions menu) and column visibility (Hide fields menu).
    const [selectedIds, setSelectedIds] = useState([]);
    const [hiddenCols, setHiddenCols] = useState(() => {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(window.localStorage.getItem('edms.dpreq.hiddenCols') || '[]'); } catch { return []; }
    });

    useEffect(() => {
        window.localStorage.setItem('edms.dpreq.hiddenCols', JSON.stringify(hiddenCols));
    }, [hiddenCols]);

    const firstRender = useRef(true);

    const visibleColumns = COLUMNS.filter((c) => !hiddenCols.includes(c.key));
    const toggleColumn = (key) =>
        setHiddenCols((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

    const rowIds = () => (applications?.data ?? []).map((a) => a.id);
    const allSelected = rowIds().length > 0 && rowIds().every((id) => selectedIds.includes(id));
    const toggleSelectAll = () => setSelectedIds(allSelected ? [] : rowIds());
    const toggleSelect = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const bulkArchive = async () => {
        if (selectedIds.length === 0) return;
        const ok = await confirmAction({
            title: `Archive ${selectedIds.length} application${selectedIds.length > 1 ? 's' : ''}?`,
            text: 'Archived applications are removed from the register but kept for the record.',
            confirmText: 'Archive',
        });
        if (!ok) return;
        router.post(route('dpreq.bulk-archive'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => { setSelectedIds([]); notifySuccess('Applications archived'); },
        });
    };
    const bulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const ok = await confirmDanger({
            title: `Delete ${selectedIds.length} application${selectedIds.length > 1 ? 's' : ''}?`,
            text: 'This removes them from the register. This cannot be undone from here.',
            confirmText: 'Delete',
        });
        if (!ok) return;
        router.delete(route('dpreq.bulk-destroy'), {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => { setSelectedIds([]); notifySuccess('Applications deleted'); },
        });
    };

    const totalCount = stats?.total_count || Object.values(statusCounts).reduce(
        (sum, count) => sum + count,
        0
    );

    const sumOf = (keys) =>
        keys.reduce(
            (sum, key) => sum + (statusCounts[key] || 0),
            0
        );

    const inReview = stats?.in_review || sumOf(REVIEW_STATUSES);
    const cleared = stats?.cleared_this_month || sumOf(CLEARED_STATUSES);
    const avgReviewDays = stats?.avg_review_days || 0;
    const percentageChange = stats?.percentage_change || 0;

    const hasFilters =
        (filters?.search ?? '') !== '' ||
        (filters?.status ?? 'all') !== 'all' ||
        (filters?.sort ?? 'newest') !== 'newest';

    const pushFilters = (next) =>
        router.get(
            route('dpreq.index'),
            {
                search: next.search ?? searchQuery,
                status: next.status ?? statusFilter,
                sort: next.sort ?? sortOrder,
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

    const toggleSort = () => {
        const nextSort = sortOrder === 'newest' ? 'oldest' : 'newest';
        setSortOrder(nextSort);
        pushFilters({ sort: nextSort });
    };

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setSortOrder('newest');

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
            <Head title="DPO Requests" />

            <div className="px-5 py-8 font-figtree text-fg-primary sm:px-8 lg:px-12 lg:py-10">
                <div className="mx-auto max-w-[90rem]">
                    {/* Header — typographic, no icon */}
                    <div className="mb-8 border-b border-border pb-6">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">DPREQ</p>
                        <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">DPO requests</h1>
                        <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Track every research application from submission to decision. Keep review context, ownership, and timing in one dependable register.</p>
                    </div>

                    {/* Stat Cards */}
                    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
                        {[
                            {
                                label: 'Requests in register',
                                value: totalCount,
                                sub: 'All active and completed records',
                            },
                            {
                                label: 'Open review',
                                value: inReview,
                                sub: `${inReview > 0 ? inReview : 0} due this week`,
                            },
                            {
                                label: 'Avg. review time',
                                value: avgReviewDays > 0 ? `${avgReviewDays}d` : 'N/A',
                                sub: 'From submission to decision',
                            },
                            {
                                label: 'Approved this month',
                                value: cleared,
                                sub: percentageChange !== 0
                                    ? `${percentageChange > 0 ? '+' : ''}${percentageChange}% vs. last month`
                                    : 'No change vs. last month',
                                subHighlight: percentageChange > 0,
                            },
                        ].map((card) => (
                            <div
                                key={card.label}
                                className="bg-surface-secondary px-5 py-5"
                            >
                                <p className="text-xs text-fg-tertiary">
                                    {card.label}
                                </p>
                                <p className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-fg-primary">
                                    {typeof card.value === 'number'
                                        ? card.value.toLocaleString()
                                        : card.value}
                                </p>
                                <p className={`mt-1 text-xs ${card.subHighlight ? 'text-success' : 'text-fg-tertiary'}`}>
                                    {card.sub}
                                </p>
                            </div>
                        ))}
                    </section>

                    {/* Register header + search */}
                    <section className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-extrabold text-fg-primary">Request register</h2>
                            {selectedIds.length > 0 ? (
                                <p className="text-xs font-semibold text-primary">{selectedIds.length} selected</p>
                            ) : (
                                <p className="text-xs text-fg-tertiary">
                                    Showing {applications.data.length} of {applications.total ?? totalCount} requests
                                </p>
                            )}
                        </div>

                        <label className="relative block w-full sm:w-80">
                            <span className="sr-only">Search tracking number</span>
                            <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for applications"
                                className="min-h-10 w-full rounded-full border border-border bg-surface-secondary py-2 pl-10 pr-3 text-sm outline-none placeholder:text-fg-tertiary focus:border-primary focus:ring-2 focus:ring-primary-soft"
                            />
                        </label>
                    </section>

                    {/* Toolbar — Actions / Filters (left) · New application / sort / Hide fields (right) */}
                    <section className="mt-4 flex flex-wrap items-center gap-2">
                        {/* Actions */}
                        <Popover label="Actions" badge={selectedIds.length || undefined}>
                            {selectedIds.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-fg-tertiary">Select rows to act on them.</p>
                            ) : (
                                <>
                                    <button type="button" onClick={bulkArchive} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-fg-secondary hover:bg-surface-tertiary">
                                        <IconArchive size={16} /> Archive selected
                                    </button>
                                    <button type="button" onClick={bulkDelete} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger-text hover:bg-danger-bg">
                                        <IconTrash size={16} /> Delete selected
                                    </button>
                                </>
                            )}
                        </Popover>

                        {/* Filters (status) */}
                        <Popover label="Filters" icon={IconFilter} badge={statusFilter !== 'all' ? 1 : undefined}>
                            <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-fg-tertiary">Status</p>
                            {[['all', 'All requests'], ...STATUS_ORDER.filter((s) => statusCounts[s]).map((s) => [s, labelFor(s)])].map(([value, text]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setStatus(value)}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-fg-secondary hover:bg-surface-tertiary"
                                >
                                    {text}
                                    {statusFilter === value && <IconCheck size={15} className="text-primary" />}
                                </button>
                            ))}
                        </Popover>

                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            <Link
                                href={route('dpreq.create')}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-strong"
                            >
                                <IconPlus size={16} />
                                New application
                            </Link>

                            <button
                                type="button"
                                onClick={toggleSort}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-medium bg-surface-secondary px-4 text-sm font-semibold text-fg-secondary transition-colors hover:bg-surface-tertiary"
                            >
                                <IconSortDescending size={16} />
                                {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
                            </button>

                            {/* Hide fields */}
                            <Popover label="Hide fields" icon={IconEyeOff} align="right" badge={hiddenCols.length || undefined}>
                                <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-fg-tertiary">Columns</p>
                                {COLUMNS.map((col) => {
                                    const shown = !hiddenCols.includes(col.key);
                                    return (
                                        <button
                                            key={col.key}
                                            type="button"
                                            onClick={() => toggleColumn(col.key)}
                                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-fg-secondary hover:bg-surface-tertiary"
                                        >
                                            {col.label}
                                            <span className={`grid h-4 w-4 place-items-center rounded border ${shown ? 'border-primary bg-primary text-white' : 'border-border-medium text-transparent'}`}>
                                                <IconCheck size={11} />
                                            </span>
                                        </button>
                                    );
                                })}
                            </Popover>
                        </div>
                    </section>

                    {/* Desktop Table */}
                    <div className="mt-5 hidden overflow-hidden rounded-xl border border-border bg-surface-secondary md:block">
                        <table className="w-full border-collapse text-[0.8125rem]">
                            <thead>
                                <tr>
                                    <th className="w-12 border-b border-border px-5 py-3">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all"
                                            checked={allSelected}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-border-medium text-primary focus:ring-primary-soft"
                                        />
                                    </th>
                                    {visibleColumns.map((col) => (
                                        <th
                                            key={col.key}
                                            className="border-b border-border px-5 py-3 text-left text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-fg-tertiary"
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                    <th className="border-b border-border px-5 py-3" />
                                </tr>
                            </thead>

                            <tbody>
                                {applications.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={visibleColumns.length + 2}
                                            className="px-5 py-12 text-center text-sm text-fg-tertiary"
                                        >
                                            {totalCount === 0
                                                ? 'No applications yet. Create the first one to get moving.'
                                                : 'No matching applications. Clear the filters and try again.'}
                                        </td>
                                    </tr>
                                ) : (
                                    applications.data.map((application) => {
                                        const isSelected = selectedIds.includes(application.id);
                                        const cell = {
                                            tracking: <span className="font-bold tabular-nums text-primary">{application.tracking_number || 'No tracking #'}</span>,
                                            title: <span className="font-semibold text-fg-primary">{titleFor(application)}</span>,
                                            department: <span className="text-fg-tertiary">{departmentFor(application)}</span>,
                                            status: <StatusBadge status={application.status} label={labelFor(application.status)} />,
                                            created: <span className="tabular-nums text-fg-tertiary">{formatDate(application.created_at)}</span>,
                                        };
                                        return (
                                            <tr
                                                key={application.id}
                                                className={`border-b border-border last:border-0 hover:bg-surface-tertiary/60 ${isSelected ? 'bg-primary-soft/40' : ''}`}
                                            >
                                                <td className="px-5 py-4">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Select ${application.tracking_number}`}
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(application.id)}
                                                        className="h-4 w-4 rounded border-border-medium text-primary focus:ring-primary-soft"
                                                    />
                                                </td>
                                                {visibleColumns.map((col) => (
                                                    <td key={col.key} className="px-5 py-4">{cell[col.key]}</td>
                                                ))}
                                                <td className="px-5 py-4">
                                                    <Link
                                                        href={route('dpreq.show', application.id)}
                                                        className="grid h-8 w-8 place-items-center rounded-full border border-border text-fg-tertiary hover:border-primary hover:text-primary"
                                                    >
                                                        <IconArrowUpRight size={15} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="mt-5 space-y-3 md:hidden">
                        {applications.data.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border-medium bg-surface-secondary px-5 py-9 text-center text-sm text-fg-tertiary">
                                {totalCount === 0
                                    ? 'No applications yet. Create the first one to get moving.'
                                    : 'No matching applications. Clear the filters and try again.'}
                            </div>
                        ) : (
                            applications.data.map((application) => (
                                <Link
                                    key={application.id}
                                    href={route('dpreq.show', application.id)}
                                    className="block rounded-xl border border-border bg-surface-secondary p-4 shadow-sm hover:border-primary-200"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[0.6875rem] font-extrabold tabular-nums text-primary-800">
                                                {application.tracking_number || 'No tracking #'}
                                            </p>
                                            <h2 className="mt-1 line-clamp-2 font-bold leading-snug text-fg-primary">
                                                {titleFor(application)}
                                            </h2>
                                            <p className="mt-1 text-xs text-fg-tertiary">
                                                {departmentFor(application)}
                                            </p>
                                        </div>
                                        <StatusBadge
                                            status={application.status}
                                            label={labelFor(application.status)}
                                        />
                                    </div>
                                    <p className="mt-3 text-xs tabular-nums text-fg-tertiary">
                                        {formatDate(application.created_at)}
                                    </p>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex flex-col items-center justify-between gap-2 text-xs text-fg-tertiary sm:flex-row">
                        <span>
                            Showing {applications.data.length} of {applications.total ?? totalCount} requests
                        </span>
                        <span>
                            Last synced today at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                    </div>

                    {/* Pagination */}
                    <Pagination paginator={applications} />

                </div>
            </div>
        </AuthenticatedLayout>
    );
}