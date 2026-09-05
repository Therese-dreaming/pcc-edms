import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Edit({ targetUser, roles }) {
    const { data, setData, put, processing, errors } = useForm({
        name: targetUser.name,
        role_id: targetUser.role_id ?? '',
        department: targetUser.department ?? '',
        account_status: targetUser.account_status,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.users.update', targetUser.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit ${targetUser.name}`} />

            <div className="py-8">
                <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="mb-8 border-b border-border pb-6">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Administration</p>
                        <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Edit User</h1>
                        <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">{targetUser.email}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="name" value="Full Name" />
                                    <TextInput
                                        id="name"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="role_id" value="Role" />
                                    <select
                                        id="role_id"
                                        className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
                                        value={data.role_id}
                                        onChange={(e) => setData('role_id', e.target.value)}
                                    >
                                        <option value="">— No role —</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.role_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="department" value="Department/Office (optional)" />
                                    <TextInput
                                        id="department"
                                        className="mt-1 block w-full"
                                        value={data.department}
                                        onChange={(e) => setData('department', e.target.value)}
                                    />
                                    <InputError message={errors.department} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="account_status" value="Account Status" />
                                    <select
                                        id="account_status"
                                        className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
                                        value={data.account_status}
                                        onChange={(e) => setData('account_status', e.target.value)}
                                    >
                                        <option value="pending_validation">Pending Validation</option>
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="deactivated">Deactivated</option>
                                    </select>
                                    <InputError message={errors.account_status} className="mt-2" />
                                </div>

                                <PrimaryButton disabled={processing}>Save Changes</PrimaryButton>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
