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
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Edit User</h2>}
        >
            <Head title={`Edit ${targetUser.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <p className="mb-4 text-sm text-gray-600">{targetUser.email}</p>

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
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
        </AuthenticatedLayout>
    );
}
