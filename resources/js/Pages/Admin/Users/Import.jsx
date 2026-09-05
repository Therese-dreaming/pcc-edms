import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { EmptyRow, TBody, THead, Table, Td, Th, Tr } from '@/Components/Table';
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
        <AuthenticatedLayout>
            <Head title="Bulk Import Users" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="mb-8 border-b border-border pb-6">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Administration</p>
                        <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Bulk Import Users</h1>
                        <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Upload a CSV to create multiple accounts at once.</p>
                    </div>
                    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <p className="mb-4 text-sm text-zinc-600">
                                Upload a CSV with columns <code className="rounded bg-zinc-100 px-1">name</code>,{' '}
                                <code className="rounded bg-zinc-100 px-1">email</code>,{' '}
                                <code className="rounded bg-zinc-100 px-1">role</code> (optional),{' '}
                                <code className="rounded bg-zinc-100 px-1">department</code> (optional), and{' '}
                                <code className="rounded bg-zinc-100 px-1">account_status</code> (optional, defaults to
                                "pending_validation"). The <code className="rounded bg-zinc-100 px-1">role</code> column
                                must match one of the role slugs below exactly, not the display name.
                            </p>

                            <details className="mb-4 rounded-md bg-zinc-50 border border-zinc-200 p-3 text-sm">
                                <summary className="cursor-pointer font-medium text-zinc-700">Valid role slugs</summary>
                                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                                    {roles.map((r) => (
                                        <code key={r.id} className="text-xs text-zinc-600">{r.name}</code>
                                    ))}
                                </div>
                            </details>

                            <form onSubmit={submitPreview} className="flex items-end gap-2">
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={(e) => setData('file', e.target.files[0])}
                                        className="block w-full text-sm text-zinc-600"
                                    />
                                    <InputError message={errors.file} className="mt-2" />
                                </div>
                                <PrimaryButton disabled={processing || !data.file}>Preview</PrimaryButton>
                            </form>
                        </div>
                    </div>

                    {preview && (
                        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-zinc-900">
                                    Preview — {validCount} valid, {invalidCount} invalid
                                </h3>
                                {validCount > 0 && (
                                    <form onSubmit={submitConfirm}>
                                        <PrimaryButton>Confirm Import ({validCount})</PrimaryButton>
                                    </form>
                                )}
                            </div>

                            <Table>
                                <THead>
                                    <Tr>
                                        <Th>Name</Th>
                                        <Th>Email</Th>
                                        <Th>Role</Th>
                                        <Th>Department</Th>
                                        <Th>Status</Th>
                                        <Th>Result</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {preview.length === 0 && <EmptyRow colSpan={6}>No rows found in this file.</EmptyRow>}
                                    {preview.map((row, i) => (
                                        <Tr key={i} className={row.valid ? '' : 'bg-red-50'}>
                                            <Td>{row.name}</Td>
                                            <Td>{row.email}</Td>
                                            <Td>{row.role || '—'}</Td>
                                            <Td>{row.department || '—'}</Td>
                                            <Td>{row.account_status}</Td>
                                            <Td>
                                                {row.valid ? (
                                                    <span className="text-emerald-700 font-medium">Valid</span>
                                                ) : (
                                                    <span className="text-red-700">{row.errors.join(' ')}</span>
                                                )}
                                            </Td>
                                        </Tr>
                                    ))}
                                </TBody>
                            </Table>
                        </div>
                    )}

                    <Link href={route('admin.users.index')} className="text-sm text-primary-700 hover:underline">
                        Back to User Management
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
