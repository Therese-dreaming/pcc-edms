import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import SignaturePad from '@/Components/SignaturePad';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    IconShieldLock,
    IconUser,
    IconFileText,
    IconCheck,
    IconX,
    IconClock,
    IconDownload,
    IconPencil,
    IconAlertTriangle,
    IconSend,
    IconUserCheck,
    IconArrowRight,
    IconLoader2,
} from '@tabler/icons-react';

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

// Helper function to format snake_case to Title Case
const formatApplicantType = (type) => {
    if (!type) return 'N/A';
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const formatFieldValue = (value) => {
    if (!value) return null;
    if (typeof value !== 'string') return value;
    return value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

// Shared panel + label primitives so the whole page reads as one system.
const PANEL =
    "rounded-[18px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(41,37,36,0.04),0_8px_24px_-12px_rgba(41,37,36,0.10)]";
const PANEL_HEAD =
    'flex items-center justify-between border-b border-stone-200 px-5 py-3.5';
const PANEL_TITLE =
    'text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-stone-400';
const MICRO_LABEL =
    'text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-stone-400';
const PRIMARY_BTN =
    'inline-flex items-center gap-2 rounded-xl bg-primary-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0';
const TEXTAREA =
    'block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-[0.8125rem] text-stone-900 placeholder-stone-400 shadow-sm transition focus:border-primary-600 focus:outline-none focus:ring-[3px] focus:ring-primary-600/15';

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

    // DPO Approver was retired as a separate role — dpo_staff now owns the DPO track end to
    // end, including final approval.
    const canScreenerAct = roleName === 'dpo_staff';

    const details = [
        {
            label: 'Applicant',
            value: application.applicant?.name,
        },
        {
            label: 'Adviser',
            value: application.research_application?.adviser_name,
        },
        {
            label: 'Applicant Type',
            value: formatApplicantType(application.applicant_type),
            alwaysShow: true,
        },
        {
            label: 'Purpose',
            value: formatFieldValue(application.purpose),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={application.tracking_number} />

            <div className="py-8 font-grotesk text-stone-900 [font-optical-sizing:auto]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header — identity + status inline, actions right */}
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
                        <div className="flex min-w-0 flex-1 items-start gap-3.5">
                            <span className="flex size-11 flex-none items-center justify-center rounded-[13px] bg-primary-700 text-white shadow-lg shadow-primary-700/30">
                                <IconShieldLock size={22} strokeWidth={2} />
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-stone-400 tabular-nums">
                                    {application.tracking_number}
                                </div>
                                <h1 className="mt-1 text-balance text-xl font-bold leading-tight tracking-[-0.02em] text-stone-900">
                                    {application.research_application?.research_title || (
                                        <span className="text-stone-400">Untitled Application</span>
                                    )}
                                </h1>
                                <div className="mt-2 flex items-center gap-3 text-[0.8125rem] text-stone-500">
                                    <span className="flex items-center gap-1.5">
                                        <IconUser size={14} strokeWidth={2} className="text-stone-400" />
                                        {application.applicant?.name || 'Unknown'}
                                    </span>
                                    <span className="text-stone-300">•</span>
                                    <StatusBadge
                                        status={application.status}
                                        label={STATUS_LABELS[application.status]}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {canScreenerAct && legalTransitions.includes('screening') && (
                                <button
                                    onClick={() => router.post(route('dpreq.start-screening', application.id))}
                                    className={PRIMARY_BTN}
                                >
                                    <IconSend size={14} strokeWidth={2.5} />
                                    Start Screening
                                </button>
                            )}
                            {isOwner && application.status === 'returned' && (
                                <button
                                    onClick={() => router.post(route('dpreq.resubmit', application.id))}
                                    className={PRIMARY_BTN}
                                >
                                    <IconSend size={14} strokeWidth={2.5} />
                                    Resubmit
                                </button>
                            )}
                            {canScreenerAct && application.status === 'endorsed' && (
                                <button
                                    onClick={() => router.post(route('dpreq.approve', application.id))}
                                    className={PRIMARY_BTN}
                                >
                                    <IconCheck size={14} strokeWidth={2.5} />
                                    Approve
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* LEFT COLUMN */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Application Details */}
                            <div className={PANEL}>
                                <div className={PANEL_HEAD}>
                                    <h3 className={PANEL_TITLE}>Application Details</h3>
                                </div>
                                <div className="p-5">
                                    <dl className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                        {details.map((item) => (
                                            <div key={item.label}>
                                                <dt className={`mb-1.5 ${MICRO_LABEL}`}>{item.label}</dt>
                                                <dd className="text-[0.8125rem] font-medium text-stone-900">
                                                    {item.value || (
                                                        <span className="font-normal italic text-stone-400">
                                                            Not specified
                                                        </span>
                                                    )}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            </div>

                            {/* Research Team NDA */}
                            {nda && (
                                <div className={PANEL}>
                                    <div className={PANEL_HEAD}>
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                                                <IconFileText size={16} strokeWidth={2} />
                                            </span>
                                            <div>
                                                <h3 className="text-[0.8125rem] font-semibold text-stone-900">
                                                    Research Team NDA (Form 2)
                                                </h3>
                                                <div className="mt-0.5 flex items-center gap-2 text-xs">
                                                    <span className="font-medium tabular-nums text-stone-500">
                                                        {nda.tracking_number}
                                                    </span>
                                                    <span className="text-stone-300">•</span>
                                                    <span
                                                        className={`font-medium ${
                                                            nda.status === 'fully_signed'
                                                                ? 'text-emerald-700'
                                                                : 'text-amber-700'
                                                        }`}
                                                    >
                                                        {nda.status === 'fully_signed'
                                                            ? 'Fully Signed'
                                                            : nda.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {nda.documents && nda.documents.length > 0 && (
                                            <a
                                                href={route('dpreq.nda-pdf', application.id)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 active:translate-y-px"
                                            >
                                                <IconDownload size={14} strokeWidth={2} />
                                                Download
                                            </a>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-inset ring-amber-200/70">
                                            <IconAlertTriangle
                                                size={14}
                                                className="mt-0.5 flex-shrink-0 text-amber-600"
                                                strokeWidth={2}
                                            />
                                            <p className="text-xs leading-relaxed text-amber-900">
                                                This NDA must be fully signed before DPO Staff can approve
                                                the application.
                                            </p>
                                        </div>

                                        {/* Signatories */}
                                        <div className="space-y-2.5">
                                            <h4 className={MICRO_LABEL}>Signatories</h4>
                                            {nda.signatories && nda.signatories.length > 0 ? (
                                                <div className="space-y-2">
                                                    {nda.signatories.map((s) => (
                                                        <div
                                                            key={s.id}
                                                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 ring-1 ring-inset ${
                                                                s.signed_at
                                                                    ? 'bg-emerald-50/60 ring-emerald-200/70'
                                                                    : 'bg-stone-50 ring-stone-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <span
                                                                    className={`flex size-8 items-center justify-center rounded-full ${
                                                                        s.signed_at
                                                                            ? 'bg-emerald-100 text-emerald-700'
                                                                            : 'bg-stone-200 text-stone-500'
                                                                    }`}
                                                                >
                                                                    {s.signed_at ? (
                                                                        <IconCheck size={16} strokeWidth={2.5} />
                                                                    ) : (
                                                                        <IconUserCheck size={16} strokeWidth={2} />
                                                                    )}
                                                                </span>
                                                                <div>
                                                                    <p className="text-[0.8125rem] font-medium text-stone-900">
                                                                        {s.full_name}
                                                                    </p>
                                                                    <p className="text-xs text-stone-500">{s.role}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                {s.signed_at ? (
                                                                    <div className="flex items-center gap-1 text-emerald-700">
                                                                        <IconClock size={12} strokeWidth={2} />
                                                                        <span className="text-xs font-medium tabular-nums">
                                                                            {new Date(s.signed_at).toLocaleDateString(
                                                                                'en-US',
                                                                                {
                                                                                    month: 'short',
                                                                                    day: 'numeric',
                                                                                    year: 'numeric',
                                                                                },
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs font-medium text-stone-400">
                                                                        Pending
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-xl bg-stone-50 py-6 text-center ring-1 ring-inset ring-stone-200">
                                                    <span className="mb-2 inline-flex size-10 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                                                        <IconUserCheck size={20} />
                                                    </span>
                                                    <p className="text-xs text-stone-500">
                                                        No signatories assigned yet.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sign NDA */}
                                        {mySignatory && !mySignatory.signed_at && (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    signForm.post(route('dpreq.sign-nda', application.id));
                                                }}
                                                className="mt-5 space-y-3 rounded-xl bg-primary-50 p-4 ring-1 ring-inset ring-primary-200/70"
                                            >
                                                <div className="mb-2 flex items-center gap-2">
                                                    <IconPencil size={16} className="text-primary-700" strokeWidth={2} />
                                                    <h4 className="text-[0.8125rem] font-semibold text-stone-900">
                                                        Sign this NDA
                                                    </h4>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-stone-600">
                                                        Full Name
                                                    </label>
                                                    <TextInput
                                                        placeholder="Type your full name to sign"
                                                        className="block w-full text-sm"
                                                        value={signForm.data.typed_full_name}
                                                        onChange={(e) =>
                                                            signForm.setData('typed_full_name', e.target.value)
                                                        }
                                                    />
                                                    <InputError message={signForm.errors.typed_full_name} />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-stone-600">
                                                        Signature
                                                    </label>
                                                    <SignaturePad
                                                        onChange={(image) => signForm.setData('signature_image', image)}
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={signForm.processing}
                                                    className={PRIMARY_BTN}
                                                >
                                                    {signForm.processing ? (
                                                        <IconLoader2 size={14} strokeWidth={2.5} className="animate-spin" />
                                                    ) : (
                                                        <IconPencil size={14} strokeWidth={2.5} />
                                                    )}
                                                    {signForm.processing ? 'Signing…' : 'Sign NDA'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Workflow Actions */}
                            <div className={PANEL}>
                                <div className={PANEL_HEAD}>
                                    <h3 className={PANEL_TITLE}>Workflow Actions</h3>
                                </div>

                                <div className="space-y-4 p-5">
                                    {/* Start Screening */}
                                    {canScreenerAct && legalTransitions.includes('screening') && (
                                        <button
                                            onClick={() => router.post(route('dpreq.start-screening', application.id))}
                                            className={PRIMARY_BTN}
                                        >
                                            <IconSend size={14} strokeWidth={2.5} />
                                            Start Screening
                                        </button>
                                    )}

                                    {/* Screening actions */}
                                    {canScreenerAct && application.status === 'screening' && (
                                        <div className="space-y-4">
                                            {/* Return for Correction */}
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    returnForm.post(route('dpreq.return', application.id));
                                                }}
                                                className="space-y-3 rounded-xl bg-red-50/60 p-4 ring-1 ring-inset ring-red-200/70"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <IconX size={16} className="text-red-700" strokeWidth={2} />
                                                    <h4 className="text-[0.8125rem] font-semibold text-stone-900">
                                                        Return for Correction
                                                    </h4>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-stone-600">
                                                        Comments <span className="text-red-600">*</span>
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        className={TEXTAREA}
                                                        placeholder="Describe what needs to be corrected…"
                                                        value={returnForm.data.comments}
                                                        onChange={(e) => returnForm.setData('comments', e.target.value)}
                                                    />
                                                    <InputError message={returnForm.errors.comments} />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={returnForm.processing}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-red-800 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0"
                                                >
                                                    {returnForm.processing ? (
                                                        <IconLoader2 size={14} strokeWidth={2.5} className="animate-spin" />
                                                    ) : (
                                                        <IconX size={14} strokeWidth={2.5} />
                                                    )}
                                                    {returnForm.processing ? 'Returning…' : 'Return for Correction'}
                                                </button>
                                            </form>

                                            {/* Pass Screening */}
                                            <div className="rounded-xl bg-emerald-50/60 p-4 ring-1 ring-inset ring-emerald-200/70">
                                                <div className="mb-2 flex items-center gap-1.5">
                                                    <IconCheck size={16} className="text-emerald-700" strokeWidth={2} />
                                                    <h4 className="text-[0.8125rem] font-semibold text-stone-900">
                                                        Pass Screening
                                                    </h4>
                                                </div>
                                                <p className="mb-3 text-xs text-stone-600">
                                                    Move this application to Under Review to proceed with the review
                                                    process.
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        router.post(route('dpreq.pass-screening', application.id))
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:translate-y-px"
                                                >
                                                    <IconCheck size={14} strokeWidth={2.5} />
                                                    Pass Screening Under Review
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Resubmit */}
                                    {isOwner && application.status === 'returned' && (
                                        <div className="rounded-xl bg-primary-50 p-4 ring-1 ring-inset ring-primary-200/70">
                                            <div className="mb-2 flex items-center gap-1.5">
                                                <IconSend size={16} className="text-primary-700" strokeWidth={2} />
                                                <h4 className="text-[0.8125rem] font-semibold text-stone-900">
                                                    Ready to Resubmit?
                                                </h4>
                                            </div>
                                            <p className="mb-3 text-xs text-stone-600">
                                                Once you've addressed the feedback, resubmit your application for
                                                review.
                                            </p>
                                            <button
                                                onClick={() => router.post(route('dpreq.resubmit', application.id))}
                                                className={PRIMARY_BTN}
                                            >
                                                <IconSend size={14} strokeWidth={2.5} />
                                                Resubmit Application
                                            </button>
                                        </div>
                                    )}

                                    {/* Endorse */}
                                    {canScreenerAct && application.status === 'under_review' && (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                endorseForm.post(route('dpreq.endorse', application.id));
                                            }}
                                            className="space-y-3 rounded-xl bg-primary-50 p-4 ring-1 ring-inset ring-primary-200/70"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <IconSend size={16} className="text-primary-700" strokeWidth={2} />
                                                <h4 className="text-[0.8125rem] font-semibold text-stone-900">
                                                    Endorse for Final Approval
                                                </h4>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-stone-600">
                                                    Endorsement Comments{' '}
                                                    <span className="text-stone-400">(optional)</span>
                                                </label>
                                                <textarea
                                                    rows="3"
                                                    className={TEXTAREA}
                                                    placeholder="Add any notes for the record…"
                                                    value={endorseForm.data.comments}
                                                    onChange={(e) => endorseForm.setData('comments', e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={endorseForm.processing}
                                                className={PRIMARY_BTN}
                                            >
                                                {endorseForm.processing ? (
                                                    <IconLoader2 size={14} strokeWidth={2.5} className="animate-spin" />
                                                ) : (
                                                    <IconSend size={14} strokeWidth={2.5} />
                                                )}
                                                {endorseForm.processing ? 'Endorsing…' : 'Endorse for Final Approval'}
                                            </button>
                                        </form>
                                    )}

                                    {/* Reject */}
                                    {canScreenerAct &&
                                        ['under_review', 'endorsed'].includes(application.status) && (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    rejectForm.post(route('dpreq.reject', application.id));
                                                }}
                                                className="space-y-3 rounded-xl bg-red-50/60 p-4 ring-1 ring-inset ring-red-200/70"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <IconX size={16} className="text-red-700" strokeWidth={2} />
                                                    <h4 className="text-[0.8125rem] font-semibold text-stone-900">
                                                        Reject Application
                                                    </h4>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-stone-600">
                                                        Rejection Reason <span className="text-red-600">*</span>
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        className={TEXTAREA}
                                                        placeholder="Explain why this application is being rejected…"
                                                        value={rejectForm.data.reason}
                                                        onChange={(e) => rejectForm.setData('reason', e.target.value)}
                                                    />
                                                    <InputError message={rejectForm.errors.reason} />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={rejectForm.processing}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-red-800 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0"
                                                >
                                                    {rejectForm.processing ? (
                                                        <IconLoader2 size={14} strokeWidth={2.5} className="animate-spin" />
                                                    ) : (
                                                        <IconX size={14} strokeWidth={2.5} />
                                                    )}
                                                    {rejectForm.processing ? 'Rejecting…' : 'Reject Application'}
                                                </button>
                                            </form>
                                        )}

                                    {/* Approve */}
                                    {canScreenerAct && application.status === 'endorsed' && (
                                        <div className="rounded-xl bg-emerald-50/60 p-4 ring-1 ring-inset ring-emerald-200/70">
                                            <div className="mb-2 flex items-center gap-1.5">
                                                <IconCheck size={16} className="text-emerald-700" strokeWidth={2} />
                                                <h4 className="text-[0.8125rem] font-semibold text-stone-900">
                                                    Final Approval
                                                </h4>
                                            </div>
                                            <p className="mb-3 text-xs text-stone-600">
                                                Approve this application to finalize the review process.
                                            </p>
                                            <button
                                                onClick={() => router.post(route('dpreq.approve', application.id))}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:translate-y-px"
                                            >
                                                <IconCheck size={14} strokeWidth={2.5} />
                                                Approve Application
                                            </button>
                                        </div>
                                    )}

                                    {/* No actions */}
                                    {legalTransitions.length === 0 && !canScreenerAct && (
                                        <div className="flex items-start gap-2.5 rounded-xl bg-stone-50 p-4 ring-1 ring-inset ring-stone-200">
                                            <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-500">
                                                <IconAlertTriangle size={16} strokeWidth={2} />
                                            </span>
                                            <div>
                                                <h4 className="mb-0.5 text-[0.8125rem] font-semibold text-stone-900">
                                                    No Actions Available
                                                </h4>
                                                <p className="text-xs text-stone-600">
                                                    This application is in a terminal state. No further actions can be
                                                    taken.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6 space-y-6">
                                {/* Info Card */}
                                <div className={PANEL}>
                                    <div className={PANEL_HEAD}>
                                        <h3 className={PANEL_TITLE}>Overview</h3>
                                    </div>
                                    <div className="divide-y divide-stone-100 p-5">
                                        <div className="pb-4">
                                            <dt className={`mb-1.5 ${MICRO_LABEL}`}>Applicant Type</dt>
                                            <dd className="text-[0.8125rem] font-medium text-stone-900">
                                                {formatApplicantType(application.applicant_type)}
                                            </dd>
                                        </div>
                                        <div className="py-4">
                                            <dt className={`mb-1.5 ${MICRO_LABEL}`}>Purpose</dt>
                                            <dd className="text-[0.8125rem] font-medium text-stone-900">
                                                {formatFieldValue(application.purpose) || (
                                                    <span className="font-normal italic text-stone-400">
                                                        Not specified
                                                    </span>
                                                )}
                                            </dd>
                                        </div>

                                        {/* Download Clearance Certificate */}
                                        {application.research_application?.clearance_certificate?.status === 'issued' && (
                                            <div className="pt-4">
                                                <dt className={`mb-2 ${MICRO_LABEL}`}>Clearance Certificate</dt>
                                                <a
                                                    href={route('dpreq.clearance-pdf', application.id)}
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.8125rem] font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 active:translate-y-px"
                                                >
                                                    <IconDownload size={16} strokeWidth={2} />
                                                    Download Form 3
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status History */}
                                <div className={PANEL}>
                                    <div className={PANEL_HEAD}>
                                        <h3 className={`flex items-center gap-2 ${PANEL_TITLE}`}>
                                            <IconClock size={14} className="text-stone-400" strokeWidth={2} />
                                            Status History
                                        </h3>
                                    </div>

                                    {/* Quick stats */}
                                    <div className="grid grid-cols-2 divide-x divide-stone-100 border-b border-stone-200">
                                        <div className="px-5 py-3">
                                            <div className={MICRO_LABEL}>Created</div>
                                            <div className="mt-1 text-[0.8125rem] font-semibold tabular-nums text-stone-900">
                                                {application.created_at
                                                    ? new Date(application.created_at).toLocaleDateString('en-US', {
                                                          month: 'short',
                                                          day: 'numeric',
                                                      })
                                                    : '—'}
                                            </div>
                                        </div>
                                        <div className="px-5 py-3">
                                            <div className={MICRO_LABEL}>Changes</div>
                                            <div className="mt-1 text-[0.8125rem] font-semibold tabular-nums text-stone-900">
                                                {application.status_history?.length ?? 0}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        {application.status_history && application.status_history.length > 0 ? (
                                            <div className="space-y-1">
                                                {application.status_history.map((h, index) => (
                                                    <div key={h.id} className="group relative flex gap-3">
                                                        {/* Timeline line */}
                                                        {index !== application.status_history.length - 1 && (
                                                            <div className="absolute left-[11px] top-7 h-[calc(100%-4px)] w-px bg-stone-200 transition-colors group-hover:bg-primary-200" />
                                                        )}

                                                        {/* Dot */}
                                                        <div className="relative flex-shrink-0 pt-1">
                                                            <div className="flex size-6 items-center justify-center rounded-full bg-primary-50 ring-1 ring-inset ring-primary-200 transition-colors group-hover:bg-primary-100">
                                                                <div className="size-1.5 rounded-full bg-primary-600" />
                                                            </div>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 pb-4 pt-0.5">
                                                            <div className="mb-2 flex items-center gap-1.5">
                                                                <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-[0.6875rem] font-medium capitalize text-stone-600">
                                                                    {(h.from_status ?? 'new').replaceAll('_', ' ')}
                                                                </span>
                                                                <IconArrowRight
                                                                    size={12}
                                                                    className="text-stone-300"
                                                                    strokeWidth={2}
                                                                />
                                                                <span className="inline-block rounded-md bg-primary-100 px-2 py-0.5 text-[0.6875rem] font-semibold capitalize text-primary-900">
                                                                    {(h.to_status ?? '').replaceAll('_', ' ')}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-0.5 text-xs">
                                                                <div className="flex items-center gap-1.5">
                                                                    <IconUser size={12} className="text-stone-300" />
                                                                    <span className="font-medium text-stone-700">
                                                                        {h.changed_by?.name ?? 'System'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-stone-400">
                                                                    <IconClock size={12} className="text-stone-300" />
                                                                    <time className="tabular-nums">
                                                                        {h.created_at
                                                                            ? new Date(h.created_at).toLocaleString(
                                                                                  'en-US',
                                                                                  {
                                                                                      month: 'short',
                                                                                      day: 'numeric',
                                                                                      year: 'numeric',
                                                                                      hour: 'numeric',
                                                                                      minute: '2-digit',
                                                                                  },
                                                                              )
                                                                            : 'N/A'}
                                                                    </time>
                                                                </div>
                                                            </div>

                                                            {h.comments && (
                                                                <div className="mt-2 rounded-lg bg-stone-50 px-2.5 py-2 ring-1 ring-inset ring-stone-200">
                                                                    <p className="text-xs italic leading-relaxed text-stone-600">
                                                                        &ldquo;{h.comments}&rdquo;
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center">
                                                <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                                                    <IconClock size={24} />
                                                </span>
                                                <p className="text-xs text-stone-500">No status history yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}