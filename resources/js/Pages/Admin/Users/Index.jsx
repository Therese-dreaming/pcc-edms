import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router } from '@inertiajs/react';

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
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">User Management</h2>}
        >
            <Head title="User Management" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl space-y-6 sm:px-6 lg:px-8">
                    {status && (
                        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">{status}</div>
                    )}

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                            <div className="flex flex-wrap items-end gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600">Search</label>
                                    <input
                                        type="text"
                                        defaultValue={filters.search ?? ''}
                                        onBlur={(e) => applyFilter('search', e.target.value)}
                                        placeholder="Name or email"
                                        className="mt-1 rounded-md border-gray-300 text-sm shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600">Role</label>
                                    <select
                                        defaultValue={filters.role_id ?? ''}
                                        onChange={(e) => applyFilter('role_id', e.target.value)}
                                        className="mt-1 rounded-md border-gray-300 text-sm shadow-sm"
                                    >
                                        <option value="">All roles</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600">Status</label>
                                    <select
                                        defaultValue={filters.account_status ?? ''}
                                        onChange={(e) => applyFilter('account_status', e.target.value)}
                                        className="mt-1 rounded-md border-gray-300 text-sm shadow-sm"
                                    >
                                        <option value="">All statuses</option>
                                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link href={route('admin.users.import')} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                    Bulk Import
                                </Link>
                                <Link href={route('admin.users.create')}>
                                    <PrimaryButton>New User</PrimaryButton>
                                </Link>
                            </div>
                        </div>

                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead>
                                <tr className="text-left text-gray-500">
                                    <th className="py-2 pr-4">Name</th>
                                    <th className="py-2 pr-4">Email</th>
                                    <th className="py-2 pr-4">Role</th>
                                    <th className="py-2 pr-4">Department</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Verified</th>
                                    <th className="py-2 pr-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.data.length === 0 && (
                                    <tr><td colSpan={7} className="py-6 text-center text-gray-500">No users match these filters.</td></tr>
                                )}
                                {users.data.map((u) => (
                                    <tr key={u.id}>
                                        <td className="py-2 pr-4 font-medium text-gray-800">{u.name}</td>
                                        <td className="py-2 pr-4 text-gray-600">{u.email}</td>
                                        <td className="py-2 pr-4 text-gray-600">{u.role?.name ?? '—'}</td>
                                        <td className="py-2 pr-4 text-gray-600">{u.department ?? '—'}</td>
                                        <td className="py-2 pr-4">
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                                {STATUS_LABELS[u.account_status] ?? u.account_status}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600">{u.email_verified_at ? 'Yes' : 'No'}</td>
                                        <td className="py-2 pr-4">
                                            <Link href={route('admin.users.edit', u.id)} className="text-indigo-600 hover:underline">
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {users.links.length > 3 && (
                            <div className="mt-4 flex flex-wrap justify-center gap-1">
                                {users.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-md px-3 py-1 text-sm ${
                                            link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300'
                                        } ${!link.url ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
