import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import { Table, THead, TBody, Tr, Th, Td, EmptyRow } from '@/Components/Table';
import { Head, router } from '@inertiajs/react';
import { IconFileSearch, IconFilter, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

export default function Index({ auditLogs, eventTypes, filters }) {
    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState({
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        event_type: filters.event_type || '',
        auditable_type: filters.auditable_type || '',
        auditable_id: filters.auditable_id || '',
    });

    const applyFilters = () => {
        router.get(route('admin.audit-trail.index'), localFilters, { preserveState: true });
    };

    const clearFilters = () => {
        setLocalFilters({
            date_from: '',
            date_to: '',
            event_type: '',
            auditable_type: '',
            auditable_id: '',
        });
        router.get(route('admin.audit-trail.index'), {}, { preserveState: true });
    };

    const handleInputChange = (field, value) => {
        setLocalFilters((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconFileSearch}
                    title="Audit Trail"
                    description="Immutable log of all state-changing actions across the system."
                />
            }
        >
            <Head title="Audit Trail" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-4 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-medium bg-surface-secondary px-4 text-sm font-semibold text-fg-secondary transition-colors hover:bg-surface-tertiary"
                        >
                            <IconFilter size={16} />
                            {showFilters ? 'Hide filters' : 'Show filters'}
                        </button>
                        {(Object.values(localFilters).some(Boolean)) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-medium bg-surface-secondary px-4 text-sm font-semibold text-fg-secondary transition-colors hover:bg-surface-tertiary"
                            >
                                <IconTrash size={16} />
                                Clear filters
                            </button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="mb-6 rounded-xl border border-border bg-surface-secondary p-5 shadow-resting">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-semibold text-fg-secondary">Date from</label>
                                    <input
                                        type="date"
                                        value={localFilters.date_from}
                                        onChange={(e) => handleInputChange('date_from', e.target.value)}
                                        className="mt-1.5 block w-full rounded-full border-border-medium bg-surface-primary text-sm text-fg-primary focus:border-primary focus:ring-3 focus:ring-primary-soft"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-fg-secondary">Date to</label>
                                    <input
                                        type="date"
                                        value={localFilters.date_to}
                                        onChange={(e) => handleInputChange('date_to', e.target.value)}
                                        className="mt-1.5 block w-full rounded-full border-border-medium bg-surface-primary text-sm text-fg-primary focus:border-primary focus:ring-3 focus:ring-primary-soft"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-fg-secondary">Event type</label>
                                    <select
                                        value={localFilters.event_type}
                                        onChange={(e) => handleInputChange('event_type', e.target.value)}
                                        className="mt-1.5 block w-full rounded-full border-border-medium bg-surface-primary text-sm text-fg-primary focus:border-primary focus:ring-3 focus:ring-primary-soft"
                                    >
                                        <option value="">All event types</option>
                                        {eventTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-fg-secondary">Record type</label>
                                    <input
                                        type="text"
                                        value={localFilters.auditable_type}
                                        onChange={(e) => handleInputChange('auditable_type', e.target.value)}
                                        placeholder="e.g. DpreqApplication"
                                        className="mt-1.5 block w-full rounded-full border-border-medium bg-surface-primary text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-primary focus:ring-3 focus:ring-primary-soft"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-fg-secondary">Record ID</label>
                                    <input
                                        type="number"
                                        value={localFilters.auditable_id}
                                        onChange={(e) => handleInputChange('auditable_id', e.target.value)}
                                        placeholder="e.g. 1"
                                        className="mt-1.5 block w-full rounded-full border-border-medium bg-surface-primary text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-primary focus:ring-3 focus:ring-primary-soft"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={applyFilters}
                                        className="min-h-10 w-full rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-strong focus:outline-none focus-visible:ring-3 focus-visible:ring-primary-soft"
                                    >
                                        Apply filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-border bg-surface-secondary shadow-resting">
                        <Table ariaLabel="Audit trail entries">
                            <THead>
                                <Tr>
                                    <Th>Event Type</Th>
                                    <Th>User</Th>
                                    <Th>Record</Th>
                                    <Th>IP Address</Th>
                                    <Th>Timestamp</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {auditLogs.data.length === 0 ? (
                                    <EmptyRow colSpan={5} title="No audit entries found" />
                                ) : (
                                    auditLogs.data.map((log) => (
                                        <Tr key={log.id}>
                                            <Td>{log.event_type}</Td>
                                            <Td>{log.user?.name || 'System'}</Td>
                                            <Td>
                                                {log.auditable_type
                                                    ? `${log.auditable_type.replace('App\\', '')}#${log.auditable_id}`
                                                    : '—'}
                                            </Td>
                                            <Td>{log.ip_address || '—'}</Td>
                                            <Td>{new Date(log.created_at).toLocaleString()}</Td>
                                        </Tr>
                                    ))
                                )}
                            </TBody>
                        </Table>
                    </div>

                    <Pagination paginator={auditLogs} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
