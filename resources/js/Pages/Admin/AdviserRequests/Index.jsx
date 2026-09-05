import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { IconCheck, IconUsersGroup, IconX } from '@tabler/icons-react';
import { confirmAction, confirmDanger, notifySuccess } from '@/lib/confirm';

const STATUS_STYLES = {
    pending: 'bg-warning-bg text-warning',
    approved: 'bg-success-bg text-success',
    rejected: 'bg-danger-bg text-danger',
};

export default function Index({ requests, status }) {
    useEffect(() => {
        if (status) notifySuccess(status);
    }, [status]);

    const accountTypeLabel = (req) =>
        req.account_type === 'employee_researcher' ? 'Employee researcher' : 'External adviser';

    const approve = async (req) => {
        const roleWord = req.account_type === 'employee_researcher' ? 'researcher' : 'adviser';
        const ok = await confirmAction({
            title: `Create ${roleWord} account?`,
            text: `An ${roleWord} account will be created for ${req.email} and they will be emailed a link to set their password.`,
            confirmText: 'Approve & create',
        });
        if (ok) router.post(route('admin.adviser-requests.approve', req.id), {}, { preserveScroll: true });
    };

    const reject = async (req) => {
        const ok = await confirmDanger({
            title: 'Reject request?',
            text: `The request from ${req.name} will be rejected. No account is created.`,
            confirmText: 'Reject',
        });
        if (ok) router.post(route('admin.adviser-requests.reject', req.id), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Adviser account requests" />

            <div className="px-5 py-8 text-fg-primary sm:px-8 lg:px-12 lg:py-10">
                <div className="mx-auto max-w-[80rem]">
                    <header className="mb-8 flex items-start gap-3.5">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-primary-800 text-white">
                            <IconUsersGroup size={22} />
                        </span>
                        <div>
                            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.11em] text-primary-700">
                                External adviser onboarding
                            </p>
                            <h1 className="text-3xl font-extrabold leading-none tracking-[-0.045em]">
                                Adviser account requests
                            </h1>
                            <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-fg-secondary">
                                Approve to create an <span className="font-semibold">adviser</span> account for the requester so they can run their own class of researchers.
                            </p>
                        </div>
                    </header>

                    <div className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border bg-surface-tertiary text-xs font-bold uppercase tracking-wide text-fg-secondary">
                                    <tr>
                                        <th className="px-5 py-3">Requester</th>
                                        <th className="px-5 py-3">Institution</th>
                                        <th className="px-5 py-3">Purpose</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {requests.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-fg-tertiary">
                                                No adviser account requests yet.
                                            </td>
                                        </tr>
                                    )}
                                    {requests.data.map((req) => (
                                        <tr key={req.id} className="align-top">
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-fg-primary">{req.name}</div>
                                                <div className="text-xs text-fg-tertiary">{req.email}</div>
                                                <div className="mt-1 inline-flex rounded-full bg-surface-tertiary px-2 py-0.5 text-[11px] font-semibold text-fg-secondary">{accountTypeLabel(req)}</div>
                                            </td>
                                            <td className="px-5 py-4 text-fg-secondary">
                                                <div>{req.institution || '—'}</div>
                                                {req.department && <div className="text-xs text-fg-tertiary">{req.department}</div>}
                                            </td>
                                            <td className="max-w-[24rem] px-5 py-4 text-fg-secondary">{req.purpose}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLES[req.status] ?? ''}`}>
                                                    {req.status}
                                                </span>
                                                {req.status !== 'pending' && req.reviewed_by && (
                                                    <div className="mt-1 text-xs text-fg-tertiary">by {req.reviewed_by.name}</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {req.status === 'pending' ? (
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => approve(req)}
                                                            title="Approve & create account"
                                                            aria-label="Approve and create account"
                                                            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-success hover:bg-success-bg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20"
                                                        >
                                                            <IconCheck size={18} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => reject(req)}
                                                            title="Reject request"
                                                            aria-label="Reject request"
                                                            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-danger hover:bg-danger-bg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20"
                                                        >
                                                            <IconX size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-right text-xs text-fg-tertiary">
                                                        {req.created_user ? 'Account created' : 'Reviewed'}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
