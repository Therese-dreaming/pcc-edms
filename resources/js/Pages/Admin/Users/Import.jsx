import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Import({ roles, preview }) {
    const { data, setData, post, processing, errors } = useForm({ file: null });

    const submitPreview = (e) => {
        e.preventDefault();
        post(route('admin.users.import.preview'), { forceFormData: true });
    };

    const submitConfirm = (e) => {
        e.preventDefault();
        post(route('admin.users.import.confirm'));
    };

    const validCount = preview?.filter((r) => r.valid).length ?? 0;
    const invalidCount = (preview?.length ?? 0) - validCount;

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Bulk Import Users</h2>}
        >
            <Head title="Bulk Import Users" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <p className="mb-4 text-sm text-gray-600">
                            Upload a CSV with columns <code className="rounded bg-gray-100 px-1">name</code>,{' '}
                            <code className="rounded bg-gray-100 px-1">email</code>,{' '}
                            <code className="rounded bg-gray-100 px-1">role</code> (optional),{' '}
                            <code className="rounded bg-gray-100 px-1">department</code> (optional), and{' '}
                            <code className="rounded bg-gray-100 px-1">account_status</code> (optional, defaults to
                            "pending_validation"). The <code className="rounded bg-gray-100 px-1">role</code> column
                            must match one of the role slugs below exactly, not the display name.
                        </p>

                        <details className="mb-4 rounded-md bg-gray-50 p-3 text-sm">
                            <summary className="cursor-pointer font-medium text-gray-700">Valid role slugs</summary>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                                {roles.map((r) => (
                                    <code key={r.id} className="text-xs text-gray-600">{r.name}</code>
                                ))}
                            </div>
                        </details>

                        <form onSubmit={submitPreview} className="flex items-end gap-2">
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={(e) => setData('file', e.target.files[0])}
                                />
                                <InputError message={errors.file} className="mt-2" />
                            </div>
                            <PrimaryButton disabled={processing || !data.file}>Preview</PrimaryButton>
                        </form>
                    </div>

                    {preview && (
                        <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Preview — {validCount} valid, {invalidCount} invalid
                                </h3>
                                {validCount > 0 && (
                                    <form onSubmit={submitConfirm}>
                                        <PrimaryButton>Confirm Import ({validCount})</PrimaryButton>
                                    </form>
                                )}
                            </div>

                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500">
                                        <th className="py-2 pr-4">Name</th>
                                        <th className="py-2 pr-4">Email</th>
                                        <th className="py-2 pr-4">Role</th>
                                        <th className="py-2 pr-4">Department</th>
                                        <th className="py-2 pr-4">Status</th>
                                        <th className="py-2 pr-4">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {preview.map((row, i) => (
                                        <tr key={i} className={row.valid ? '' : 'bg-red-50'}>
                                            <td className="py-2 pr-4">{row.name}</td>
                                            <td className="py-2 pr-4">{row.email}</td>
                                            <td className="py-2 pr-4">{row.role || '—'}</td>
                                            <td className="py-2 pr-4">{row.department || '—'}</td>
                                            <td className="py-2 pr-4">{row.account_status}</td>
                                            <td className="py-2 pr-4">
                                                {row.valid ? (
                                                    <span className="text-green-700">Valid</span>
                                                ) : (
                                                    <span className="text-red-700">{row.errors.join(' ')}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Link href={route('admin.users.index')} className="text-sm text-indigo-600 hover:underline">
                        Back to User Management
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
