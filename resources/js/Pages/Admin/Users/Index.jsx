import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Alert from '@/Components/Alert';
import IconButton from '@/Components/IconButton';
import Pagination from '@/Components/Pagination';
import Popover from '@/Components/Popover';
import StatusBadge from '@/Components/StatusBadge';
import { confirmAction, confirmDanger, notifySuccess } from '@/lib/confirm';
import { Head, Link, router } from '@inertiajs/react';
import { IconCheck, IconCircleCheck, IconCircleX, IconEyeOff, IconFilter, IconPencil, IconPlayerPause, IconPlus, IconSearch, IconUpload } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

const STATUS_LABELS = {
    pending_validation: 'Pending Validation',
    active: 'Active',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
};

const COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status' },
    { key: 'verified', label: 'Verified' },
];

export default function Index({ users, roles, filters, status }) {
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [selectedIds, setSelectedIds] = useState([]);
    const [hiddenCols, setHiddenCols] = useState(() => {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(window.localStorage.getItem('edms.users.hiddenCols') || '[]'); } catch { return []; }
    });
    const isFirstRender = useRef(true);

    useEffect(() => {
        window.localStorage.setItem('edms.users.hiddenCols', JSON.stringify(hiddenCols));
    }, [hiddenCols]);

    const visibleColumns = COLUMNS.filter((c) => !hiddenCols.includes(c.key));
    const toggleColumn = (key) =>
        setHiddenCols((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

    const applyFilter = (key, value) =>
        router.get(route('admin.users.index'), { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true, replace: true });

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const timeout = setTimeout(() => applyFilter('search', searchQuery), 350);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const activeFilterCount = (filters?.role_id ? 1 : 0) + (filters?.account_status ? 1 : 0);

    const rowIds = () => (users?.data ?? []).map((u) => u.id);
    const allSelected = rowIds().length > 0 && rowIds().every((id) => selectedIds.includes(id));
    const toggleSelectAll = () => setSelectedIds(allSelected ? [] : rowIds());
    const toggleSelect = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const setBulkStatus = async (accountStatus) => {
        if (selectedIds.length === 0) return;
        const verb = { active: 'Activate', suspended: 'Suspend', deactivated: 'Deactivate' }[accountStatus];
        const dialog = accountStatus === 'active' ? confirmAction : confirmDanger;
        const ok = await dialog({
            title: `${verb} ${selectedIds.length} account${selectedIds.length > 1 ? 's' : ''}?`,
            text: accountStatus === 'active'
                ? 'These accounts will be able to sign in.'
                : 'These accounts will lose access until reactivated. (Your own account is never changed here.)',
            confirmText: verb,
        });
        if (!ok) return;
        router.post(route('admin.users.bulk-status'), { ids: selectedIds, account_status: accountStatus }, {
            preserveScroll: true,
            onSuccess: () => { setSelectedIds([]); notifySuccess(`Accounts ${accountStatus === 'active' ? 'activated' : accountStatus}`); },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="mb-8 border-b border-border pb-6">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Administration</p>
                        <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">User Management</h1>
                        <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Manage accounts, roles, and access status.</p>
                    </div>
                    {status && <Alert variant="success">{status}</Alert>}

                    {/* Register header + search */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-extrabold text-fg-primary">Accounts</h2>
                            {selectedIds.length > 0 ? (
                                <p className="text-xs font-semibold text-primary">{selectedIds.length} selected</p>
                            ) : (
                                <p className="text-xs text-fg-tertiary">
                                    Showing {users.data.length} of {users.total ?? users.data.length} accounts
                                </p>
                            )}
                        </div>

                        <label className="relative block w-full sm:w-80">
                            <span className="sr-only">Search name or email</span>
                            <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search name or email"
                                className="min-h-10 w-full rounded-full border border-border bg-surface-secondary py-2 pl-10 pr-3 text-sm outline-none placeholder:text-fg-tertiary focus:border-primary focus:ring-2 focus:ring-primary-soft"
                            />
                        </label>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Popover label="Actions" badge={selectedIds.length || undefined}>
                            {selectedIds.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-fg-tertiary">Select accounts to act on them.</p>
                            ) : (
                                <>
                                    <button type="button" onClick={() => setBulkStatus('active')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-fg-secondary hover:bg-surface-tertiary">
                                        <IconCircleCheck size={16} /> Activate selected
                                    </button>
                                    <button type="button" onClick={() => setBulkStatus('suspended')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-fg-secondary hover:bg-surface-tertiary">
                                        <IconPlayerPause size={16} /> Suspend selected
                                    </button>
                                    <button type="button" onClick={() => setBulkStatus('deactivated')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger-text hover:bg-danger-bg">
                                        <IconCircleX size={16} /> Deactivate selected
                                    </button>
                                </>
                            )}
                        </Popover>

                        <Popover label="Filters" icon={IconFilter} badge={activeFilterCount || undefined}>
                            <div className="max-h-80 overflow-y-auto">
                                <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-fg-tertiary">Status</p>
                                {[['', 'All statuses'], ...Object.entries(STATUS_LABELS)].map(([value, text]) => (
                                    <button key={value || 'all'} type="button" onClick={() => applyFilter('account_status', value)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-fg-secondary hover:bg-surface-tertiary">
                                        {text}
                                        {(filters?.account_status ?? '') === value && <IconCheck size={15} className="text-primary" />}
                                    </button>
                                ))}
                                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-fg-tertiary">Role</p>
                                <button type="button" onClick={() => applyFilter('role_id', '')} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-fg-secondary hover:bg-surface-tertiary">
                                    All roles
                                    {!filters?.role_id && <IconCheck size={15} className="text-primary" />}
                                </button>
                                {roles.map((r) => (
                                    <button key={r.id} type="button" onClick={() => applyFilter('role_id', String(r.id))} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm capitalize text-fg-secondary hover:bg-surface-tertiary">
                                        {r.name.replace(/_/g, ' ')}
                                        {String(filters?.role_id ?? '') === String(r.id) && <IconCheck size={15} className="text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </Popover>

                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.users.import')}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-medium bg-surface-secondary px-4 text-sm font-semibold text-fg-secondary transition-colors hover:bg-surface-tertiary"
                            >
                                <IconUpload size={16} />
                                Bulk import
                            </Link>
                            <Link
                                href={route('admin.users.create')}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-strong"
                            >
                                <IconPlus size={16} />
                                New user
                            </Link>
                            <Popover label="Hide fields" icon={IconEyeOff} align="right" badge={hiddenCols.length || undefined}>
                                <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-fg-tertiary">Columns</p>
                                {COLUMNS.map((col) => {
                                    const shown = !hiddenCols.includes(col.key);
                                    return (
                                        <button key={col.key} type="button" onClick={() => toggleColumn(col.key)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-fg-secondary hover:bg-surface-tertiary">
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
                    <div className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
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
                                    <th className="border-b border-border px-5 py-3 text-right text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-fg-tertiary">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleColumns.length + 2} className="px-5 py-12 text-center text-sm text-fg-tertiary">No users match these filters.</td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => {
                                        const isSelected = selectedIds.includes(u.id);
                                        const cell = {
                                            name: <span className="font-semibold text-fg-primary">{u.name}</span>,
                                            email: <span className="text-fg-secondary">{u.email}</span>,
                                            role: <span className="capitalize text-fg-secondary">{u.role?.name?.replace(/_/g, ' ') ?? '—'}</span>,
                                            department: <span className="text-fg-tertiary">{u.department ?? '—'}</span>,
                                            status: <StatusBadge status={u.account_status} label={STATUS_LABELS[u.account_status]} />,
                                            verified: <span className="text-fg-tertiary">{u.email_verified_at ? 'Yes' : 'No'}</span>,
                                        };
                                        return (
                                            <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-surface-tertiary/60 ${isSelected ? 'bg-primary-soft/40' : ''}`}>
                                                <td className="px-5 py-4">
                                                    <input type="checkbox" aria-label={`Select ${u.name}`} checked={isSelected} onChange={() => toggleSelect(u.id)} className="h-4 w-4 rounded border-border-medium text-primary focus:ring-primary-soft" />
                                                </td>
                                                {visibleColumns.map((col) => (
                                                    <td key={col.key} className="px-5 py-4">{cell[col.key]}</td>
                                                ))}
                                                <td className="px-5 py-4 text-right">
                                                    <IconButton icon={IconPencil} label="Edit user" href={route('admin.users.edit', u.id)} />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination paginator={users} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
