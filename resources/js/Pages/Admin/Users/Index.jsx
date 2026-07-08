import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Alert from '@/Components/Alert';
import IconButton from '@/Components/IconButton';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import { EmptyRow, TBody, THead, Table, Td, Th, Tr } from '@/Components/Table';
import { Head, Link, router } from '@inertiajs/react';
import { IconPencil, IconUpload, IconUsers } from '@tabler/icons-react';

const STATUS_LABELS = {
    pending_validation: 'Pending Validation',
    active: 'Active',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
};

export default function Index({ users, roles, filters, status }) {
    const applyFilter = (key, value) => {
        router.get(route('admin.users.index'), { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconUsers}
                    title="User Management"
                    description="Manage accounts, roles, and access status."
                    actions={
                        <>
                            <Link
                                href={route('admin.users.import')}
                                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
                            >
                                <IconUpload size={16} aria-hidden="true" />
                                Bulk Import
                            </Link>
                            <Link href={route('admin.users.create')}>
                                <PrimaryButton>New User</PrimaryButton>
                            </Link>
                        </>
                    }
                />
            }
        >
            <Head title="User Management" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {status && <Alert variant="success">{status}</Alert>}

                    <div className="flex flex-wrap items-end gap-4 border-b border-zinc-200 pb-5">
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">Search</label>
                            <input
                                type="text"
                                defaultValue={filters.search ?? ''}
                                onBlur={(e) => applyFilter('search', e.target.value)}
                                placeholder="Name or email"
                                className="mt-1 rounded-md border-zinc-300 text-sm shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">Role</label>
                            <select
                                defaultValue={filters.role_id ?? ''}
                                onChange={(e) => applyFilter('role_id', e.target.value)}
                                className="mt-1 rounded-md border-zinc-300 text-sm shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
                            >
                                <option value="">All roles</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">Status</label>
                            <select
                                defaultValue={filters.account_status ?? ''}
                                onChange={(e) => applyFilter('account_status', e.target.value)}
                                className="mt-1 rounded-md border-zinc-300 text-sm shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
                            >
                                <option value="">All statuses</option>
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Table>
                        <THead>
                            <Tr>
                                <Th>Name</Th>
                                <Th>Email</Th>
                                <Th>Role</Th>
                                <Th>Department</Th>
                                <Th>Status</Th>
                                <Th>Verified</Th>
                                <Th align="right">Actions</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {users.data.length === 0 && (
                                <EmptyRow colSpan={7}>No users match these filters.</EmptyRow>
                            )}
                            {users.data.map((u) => (
                                <Tr key={u.id}>
                                    <Td className="font-medium text-zinc-800">{u.name}</Td>
                                    <Td>{u.email}</Td>
                                    <Td>{u.role?.name ?? '—'}</Td>
                                    <Td>{u.department ?? '—'}</Td>
                                    <Td>
                                        <StatusBadge status={u.account_status} label={STATUS_LABELS[u.account_status]} />
                                    </Td>
                                    <Td>{u.email_verified_at ? 'Yes' : 'No'}</Td>
                                    <Td align="right">
                                        <IconButton
                                            icon={IconPencil}
                                            label="Edit user"
                                            href={route('admin.users.edit', u.id)}
                                        />
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>

                    <Pagination paginator={users} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
