import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import Popover from '@/Components/Popover';
import StatusBadge from '@/Components/StatusBadge';
import { confirmAction, confirmDanger, notifySuccess } from '@/lib/confirm';
import { Head, Link, router } from '@inertiajs/react';
import { IconArchive, IconArrowUpRight, IconCheck, IconClock, IconEyeOff, IconFilter, IconFlask, IconSearch, IconTrash } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

const STATUS_LABELS = {
    draft_submitted: 'Draft Submitted',
    under_endorsement: 'Under Endorsement',
    for_screening: 'For Screening',
    for_revision: 'For Revision',
    for_review: 'For Review',
    approved: 'Approved',
    approved_with_conditions: 'Approved with Conditions',
    exempted: 'Exempted',
    deferred: 'Deferred',
    disapproved: 'Disapproved',
    clearance_issued: 'Clearance Issued',
    monitoring: 'Monitoring',
    closed: 'Closed',
    archived: 'Archived',
};

const COLUMNS = [
    { key: 'tracking', label: 'Tracking #' },
    { key: 'title', label: 'Study title' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
];

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function Index({ applications, filters, statusCounts = {} }) {
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [selectedIds, setSelectedIds] = useState([]);
    const [hiddenCols, setHiddenCols] = useState(() => {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(window.localStorage.getItem('edms.remis.hiddenCols') || '[]'); } catch { return []; }
    });
    const isFirstRender = useRef(true);

    useEffect(() => {
        window.localStorage.setItem('edms.remis.hiddenCols', JSON.stringify(hiddenCols));
    }, [hiddenCols]);

    const visibleColumns = COLUMNS.filter((c) => !hiddenCols.includes(c.key));
    const toggleColumn = (key) =>
        setHiddenCols((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

    const pushFilters = (next) =>
        router.get(
            route('remis.index'),
            { search: next.search ?? searchQuery, status: next.status ?? statusFilter },
            { preserveState: true, preserveScroll: true, replace: true },
        );

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const timeout = setTimeout(() => pushFilters({ search: searchQuery }), 350);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const setStatus = (status) => { setStatusFilter(status); pushFilters({ status }); };

    const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

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
        router.post(route('remis.bulk-archive'), { ids: selectedIds }, {
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
        router.delete(route('remis.bulk-destroy'), {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => { setSelectedIds([]); notifySuccess('Applications deleted'); },
        });
    };

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
                    {/* Register header + search */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-extrabold text-fg-primary">Ethics register</h2>
                            {selectedIds.length > 0 ? (
                                <p className="text-xs font-semibold text-primary">{selectedIds.length} selected</p>
                            ) : (
                                <p className="text-xs text-fg-tertiary">
                                    Showing {applications.data.length} of {applications.total ?? totalCount} applications
                                </p>
                            )}
                        </div>

                        <label className="relative block w-full sm:w-80">
                            <span className="sr-only">Search tracking number or title</span>
                            <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for applications"
                                className="min-h-10 w-full rounded-full border border-border bg-surface-secondary py-2 pl-10 pr-3 text-sm outline-none placeholder:text-fg-tertiary focus:border-primary focus:ring-2 focus:ring-primary-soft"
                            />
                        </label>
                    </div>

                    {/* Toolbar */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
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

                        <Popover label="Filters" icon={IconFilter} badge={statusFilter !== 'all' ? 1 : undefined}>
                            <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-fg-tertiary">Status</p>
                            {[['all', 'All applications'], ...Object.entries(STATUS_LABELS).filter(([k]) => statusCounts[k])].map(([value, text]) => (
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

                        <div className="ml-auto">
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
                    </div>

                    {/* Table */}
                    <div className="mt-5 overflow-hidden rounded-xl border border-border bg-surface-secondary">
                        <table className="w-full border-collapse text-[0.8125rem]">
                            <thead>
                                <tr>
                                    <th className="w-12 border-b border-border px-5 py-3">
                                        <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-border-medium text-primary focus:ring-primary-soft" />
                                    </th>
                                    {visibleColumns.map((col) => (
                                        <th key={col.key} className="border-b border-border px-5 py-3 text-left text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-fg-tertiary">
                                            {col.label}
                                        </th>
                                    ))}
                                    <th className="border-b border-border px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {applications.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleColumns.length + 2} className="px-5 py-12 text-center text-sm text-fg-tertiary">
                                            {totalCount === 0
                                                ? 'No applications yet — submitted via Form 1 under DPREQ.'
                                                : 'No matching applications. Try adjusting your search or filter.'}
                                        </td>
                                    </tr>
                                ) : (
                                    applications.data.map((application) => {
                                        const isSelected = selectedIds.includes(application.id);
                                        const cell = {
                                            tracking: (
                                                <span className="inline-flex items-center gap-1.5 font-bold tabular-nums text-primary">
                                                    <IconFlask size={14} strokeWidth={2} />
                                                    {application.tracking_number}
                                                </span>
                                            ),
                                            title: <span className="font-semibold text-fg-primary">{application.research_application?.research_title}</span>,
                                            status: <StatusBadge status={application.status} label={STATUS_LABELS[application.status]} />,
                                            created: (
                                                <span className="inline-flex items-center gap-1.5 tabular-nums text-fg-tertiary">
                                                    <IconClock size={14} className="text-fg-tertiary" />
                                                    {formatDate(application.created_at)}
                                                </span>
                                            ),
                                        };
                                        return (
                                            <tr key={application.id} className={`border-b border-border last:border-0 hover:bg-surface-tertiary/60 ${isSelected ? 'bg-primary-soft/40' : ''}`}>
                                                <td className="px-5 py-4">
                                                    <input type="checkbox" aria-label={`Select ${application.tracking_number}`} checked={isSelected} onChange={() => toggleSelect(application.id)} className="h-4 w-4 rounded border-border-medium text-primary focus:ring-primary-soft" />
                                                </td>
                                                {visibleColumns.map((col) => (
                                                    <td key={col.key} className="px-5 py-4">{cell[col.key]}</td>
                                                ))}
                                                <td className="px-5 py-4">
                                                    <Link href={route('remis.show', application.id)} className="grid h-8 w-8 place-items-center rounded-full border border-border text-fg-tertiary hover:border-primary hover:text-primary">
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

                    <Pagination paginator={applications} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
