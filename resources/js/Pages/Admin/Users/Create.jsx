import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Create({ roles }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        role_id: '',
        department: '',
        applicant_category: '',
        account_status: 'active',
    });

    // Student/employee only matters for researcher applicant accounts — it drives the DPREQ/REMIS
    // intake so the applicant never picks it themselves (2026-09-05).
    const selectedRole = roles.find((r) => String(r.id) === String(data.role_id));
    const isResearcherRole = (selectedRole?.name ?? '').startsWith('researcher_');

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="New User" />

            <div className="py-8">
                <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="mb-8 border-b border-border pb-6">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Administration</p>
                        <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">New User</h1>
                        <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Create an account and assign it a role.</p>
                    </div>
                    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <p className="mb-4 text-sm text-zinc-600">
                                A random password is generated and the new account is emailed a link to set its own
                                password and verify its email address.
                            </p>

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
                                    <InputLabel htmlFor="email" value="Email Address" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="role_id" value="Role" />
                                    <select
                                        id="role_id"
                                        className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
                                        value={data.role_id}
                                        onChange={(e) => setData('role_id', e.target.value)}
                                    >
                                        <option value="">— No role yet —</option>
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

                                {isResearcherRole && (
                                    <div>
                                        <InputLabel htmlFor="applicant_category" value="Filing as (researcher accounts)" />
                                        <select
                                            id="applicant_category"
                                            className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
                                            value={data.applicant_category}
                                            onChange={(e) => setData('applicant_category', e.target.value)}
                                        >
                                            <option value="">Student (default)</option>
                                            <option value="student">Student</option>
                                            <option value="employee">Employee</option>
                                        </select>
                                        <InputError message={errors.applicant_category} className="mt-2" />
                                    </div>
                                )}

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

                                <PrimaryButton disabled={processing}>Create User</PrimaryButton>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
