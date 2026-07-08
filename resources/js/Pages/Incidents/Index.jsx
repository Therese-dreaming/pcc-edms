import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import { EmptyRow, TBody, THead, Table, Td, Th, Tr } from '@/Components/Table';
import { Head, Link, router } from '@inertiajs/react';
import { IconAlertTriangle, IconSearch } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

const STATUS_LABELS = {
    reported: 'Reported',
    under_investigation: 'Under Investigation',
    corrective_action_in_progress: 'Corrective Action in Progress',
    resolved: 'Resolved',
    closed: 'Closed',
};

const SEVERITY_STYLES = {
    low: 'bg-zinc-100 text-zinc-700',
    medium: 'bg-amber-50 text-amber-800 border border-amber-200',
    high: 'bg-orange-50 text-orange-800 border border-orange-200',
    critical: 'bg-red-50 text-red-800 border border-red-200',
};

export default function Index({ incidents, filters, statusCounts = {} }) {
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const isFirstRender = useRef(true);

    const pushFilters = (next) => {
        router.get(
            route('incidents.index'),
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
                    icon={IconAlertTriangle}
                    title="Incident Reports"
                    description="Reported incidents across ongoing studies and their investigation status."
                />
            }
        >
            <Head title="Incident Reports" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative sm:max-w-xs sm:flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <IconSearch size={16} className="text-zinc-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search tracking # or type..."
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
                                <Th>Study</Th>
                                <Th>Type</Th>
                                <Th>Severity</Th>
                                <Th>Status</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {incidents.data.length === 0 && (
                                <EmptyRow colSpan={4}>
                                    {totalCount === 0
                                        ? 'No incidents reported.'
                                        : 'No matching incidents. Try adjusting your search or filter.'}
                                </EmptyRow>
                            )}
                            {incidents.data.map((incident) => (
                                <Tr key={incident.id}>
                                    <Td>
                                        <Link
                                            href={route('incidents.show', incident.id)}
                                            className="group inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-primary-700"
                                        >
                                            <IconAlertTriangle size={14} className="text-zinc-400 group-hover:text-primary-600" strokeWidth={2} />
                                            {incident.remis_application?.tracking_number}
                                        </Link>
                                    </Td>
                                    <Td className="capitalize">{incident.incident_type?.replace(/_/g, ' ')}</Td>
                                    <Td>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${SEVERITY_STYLES[incident.severity] ?? SEVERITY_STYLES.low}`}>
                                            {incident.severity}
                                        </span>
                                    </Td>
                                    <Td>
                                        <StatusBadge status={incident.status} label={STATUS_LABELS[incident.status]} />
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>

                    <Pagination paginator={incidents} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
