import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import SignaturePad from '@/Components/SignaturePad';
import { Head, router, useForm, usePage } from '@inertiajs/react';

const STATUS_LABELS = {
    draft: 'Draft',
    submitted: 'Submitted',
    screening: 'Screening',
    returned: 'Returned',
    under_review: 'Under Review',
    endorsed: 'Endorsed',
    rejected: 'Rejected',
    approved: 'Approved',
    clearance_issued: 'Clearance Issued',
};

// docs/4.4-audit-trail-status-tracking.md — applicants see a simplified progress tracker,
// internal reviewers see full status + comment history. This page shows the full history to
// everyone with view access (docs/0.2 already gates who can view the record at all); a
// simplified applicant-only view is a follow-up, not built here.
export default function Show({ application, legalTransitions }) {
    const { auth } = usePage().props;
    const roleName = auth.roleName;
    const isOwner = application.applicant_id === auth.user.id;

    const returnForm = useForm({ comments: '' });
    const endorseForm = useForm({ comments: '' });
    const rejectForm = useForm({ reason: '' });
    const signForm = useForm({ typed_full_name: '', signature_image: null });

    const nda = application.research_application?.research_team_nda;
    const mySignatory = nda?.signatories?.find((s) => s.user_id === auth.user.id);

    const canScreenerAct = roleName === 'dpo_staff';
    const canApproverAct = roleName === 'dpo_approver';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {application.tracking_number}
                </h2>
            }
        >
            <Head title={application.tracking_number} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="text-lg font-semibold">
                            {application.research_application?.research_title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Status: <span className="font-semibold">{STATUS_LABELS[application.status] ?? application.status}</span>
                        </p>
                        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-gray-500">Applicant</dt>
                                <dd>{application.applicant?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Adviser</dt>
                                <dd>{application.research_application?.adviser_name}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Applicant Type</dt>
                                <dd>{application.applicant_type}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Purpose</dt>
                                <dd>{application.purpose}</dd>
                            </div>
                        </dl>
                    </div>

                    {nda && (
                        <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                            <h3 className="text-lg font-semibold">Research Team NDA (Form 2) — {nda.tracking_number}</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Status: <span className="font-semibold">{nda.status}</span> — must be fully
                                signed before the DPO Approver can approve this application (docs/0.4).
                            </p>
                            <ul className="mt-3 space-y-1 text-sm">
                                {nda.signatories?.map((s) => (
                                    <li key={s.id}>
                                        {s.full_name} ({s.role}) —{' '}
                                        {s.signed_at ? `signed ${s.signed_at}` : 'not yet signed'}
                                    </li>
                                ))}
                            </ul>

                            {mySignatory && !mySignatory.signed_at && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        signForm.post(route('dpreq.sign-nda', application.id));
                                    }}
                                    className="mt-4 flex items-end gap-2"
                                >
                                    <div className="flex-1 space-y-2">
                                        <TextInput
                                            placeholder="Type your full name to sign"
                                            className="block w-full"
                                            value={signForm.data.typed_full_name}
                                            onChange={(e) => signForm.setData('typed_full_name', e.target.value)}
                                        />
                                        <InputError message={signForm.errors.typed_full_name} className="mt-2" />
                                        <SignaturePad onChange={(image) => signForm.setData('signature_image', image)} />
                                        <PrimaryButton disabled={signForm.processing}>Sign NDA</PrimaryButton>
                                    </div>
                                </form>
                            )}

                            {nda.documents && nda.documents.length > 0 && (
                                <a
                                    href={route('dpreq.nda-pdf', application.id)}
                                    className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
                                >
                                    Download signed NDA PDF
                                </a>
                            )}
                        </div>
                    )}

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold">Actions</h3>

                        {canScreenerAct && legalTransitions.includes('screening') && (
                            <PrimaryButton
                                onClick={() => router.post(route('dpreq.start-screening', application.id))}
                            >
                                Start Screening
                            </PrimaryButton>
                        )}

                        {canScreenerAct && application.status === 'screening' && (
                            <div className="space-y-4">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        returnForm.post(route('dpreq.return', application.id));
                                    }}
                                    className="space-y-2"
                                >
                                    <textarea
                                        className="block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="Comments (required to return for correction)"
                                        value={returnForm.data.comments}
                                        onChange={(e) => returnForm.setData('comments', e.target.value)}
                                    />
                                    <InputError message={returnForm.errors.comments} />
                                    <div className="flex gap-2">
                                        <DangerButton disabled={returnForm.processing}>Return for Correction</DangerButton>
                                        <SecondaryButton
                                            type="button"
                                            onClick={() =>
                                                router.post(route('dpreq.pass-screening', application.id))
                                            }
                                        >
                                            Pass Screening → Under Review
                                        </SecondaryButton>
                                    </div>
                                </form>
                            </div>
                        )}

                        {isOwner && application.status === 'returned' && (
                            <PrimaryButton
                                onClick={() => router.post(route('dpreq.resubmit', application.id))}
                            >
                                Resubmit
                            </PrimaryButton>
                        )}

                        {canScreenerAct && application.status === 'under_review' && (
                            <div className="space-y-4">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        endorseForm.post(route('dpreq.endorse', application.id));
                                    }}
                                    className="space-y-2"
                                >
                                    <textarea
                                        className="block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="Endorsement comments (optional)"
                                        value={endorseForm.data.comments}
                                        onChange={(e) => endorseForm.setData('comments', e.target.value)}
                                    />
                                    <PrimaryButton disabled={endorseForm.processing}>
                                        Endorse to DPO Approver
                                    </PrimaryButton>
                                </form>
                            </div>
                        )}

                        {(canScreenerAct || canApproverAct) &&
                            ['under_review', 'endorsed'].includes(application.status) && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        rejectForm.post(route('dpreq.reject', application.id));
                                    }}
                                    className="mt-4 space-y-2"
                                >
                                    <textarea
                                        className="block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="Rejection reason (required)"
                                        value={rejectForm.data.reason}
                                        onChange={(e) => rejectForm.setData('reason', e.target.value)}
                                    />
                                    <InputError message={rejectForm.errors.reason} />
                                    <DangerButton disabled={rejectForm.processing}>Reject</DangerButton>
                                </form>
                            )}

                        {canApproverAct && application.status === 'endorsed' && (
                            <PrimaryButton
                                className="mt-4"
                                onClick={() => router.post(route('dpreq.approve', application.id))}
                            >
                                Approve
                            </PrimaryButton>
                        )}

                        {legalTransitions.length === 0 && (
                            <p className="text-sm text-gray-500">No further actions — this application is in a terminal state.</p>
                        )}
                    </div>

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold">Status History</h3>
                        <ul className="space-y-2 text-sm">
                            {application.status_history?.map((h) => (
                                <li key={h.id} className="border-b pb-2">
                                    <span className="font-semibold">
                                        {h.from_status ?? '(new)'} → {h.to_status}
                                    </span>{' '}
                                    by {h.changed_by?.name ?? 'system'} at {h.created_at}
                                    {h.comments && <div className="text-gray-600">"{h.comments}"</div>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
