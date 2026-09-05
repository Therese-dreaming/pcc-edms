import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { IconTrash, IconUserCircle, IconLock } from '@tabler/icons-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="border-b border-border pb-6">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Account</p>
                        <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Profile</h1>
                        <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Manage your account information and security.</p>
                    </div>
                    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                    <IconUserCircle size={20} className="text-primary-700" strokeWidth={2} />
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-900">Profile Information</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                    <IconLock size={20} className="text-primary-700" strokeWidth={2} />
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-900">Password</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden">
                        <div className="border-b border-red-200 bg-red-50/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                    <IconTrash size={20} className="text-red-700" strokeWidth={2} />
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-900">Danger Zone</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
