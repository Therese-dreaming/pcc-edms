import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import RevisionPanel from '@/Components/RevisionPanel';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import SignaturePad from '@/Components/SignaturePad';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { confirmAction, confirmDanger, confirmWithPassword, notifySuccess, notifyResultError } from '@/lib/confirm';

const STATUS_LABELS = {
    draft: 'Draft',
    submitted: 'Submitted',
    returned: 'Returned',
    under_review: 'Under Review',
    rejected: 'Rejected',
    approved: 'Approved',
    clearance_issued: 'Clearance Issued',
};

// Helper — snake_case / value formatting.
const titleCase = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') return String(value);
    return value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const formatDate = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const yesNo = (value) => (value ? 'Yes' : 'No');

// A4 (concern 5) — Form-1 uploads (research proposal, consent, instrument, additional) attach to
// the DPREQ/REMIS application but were never listed on Show. Map the stored `document_type` to a
// readable label; unknown types fall back to a title-cased version of the raw type.
const DOCUMENT_TYPE_LABELS = {
    Form1Application: 'Form 1 — Application',
    ResearchProposal: 'Research Proposal',
    ConsentForm: 'Consent Form',
    Instrument: 'Data Collection Instrument',
    AdditionalDocument: 'Additional Document',
    nda_pdf: 'Research Team NDA',
    ProgressReportSupportingDocument: 'Progress Report Attachment',
    FinalOutputs: 'Final Output',
    // Intake uploads are stored under their FileLabel token as the document_type.
    RESEARCHPROPOSAL: 'Research Proposal',
    QUESTIONNAIRE: 'Research Instrument',
    APPROVALLETTER: 'Approved Request Letter',
    ENDORSEMENTLETTER: "Adviser's Endorsement Letter",
    INFORMEDCONSENT: 'Consent Form',
    CONSENTLETTER: 'Parent Consent',
    ASSENTFORM: 'Assent Form',
    PERMISSIONLETTER: 'Permission Letter',
    ETHICSFORM: 'Ethics Training Certificate',
    SURVEYFORM: 'Survey Form',
    DATASET: 'Dataset',
    DATAPRIVACYFORM: 'Data Privacy Form',
    OTHERDOCUMENT: 'Other Document',
};

// Generated system documents (have their own UI / download buttons) — kept OUT of the uploaded
// "Submitted Documents" list (concern 6, 2026-07-28).
const GENERATED_DOC_TYPES = [
    'Form1Application', 'nda_pdf',
    'DpreqClearanceCertificate', 'RemisClearanceCertificate', 'RemisExemptionCertificate',
];

const documentLabel = (type) => DOCUMENT_TYPE_LABELS[type] ?? titleCase(type);

const DOCUMENT_STATUS_STYLES = {
    current: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
    superseded: 'bg-surface-tertiary text-fg-secondary ring-border',
    archived: 'bg-amber-50 text-amber-700 ring-amber-200/70',
};


const asList = (value) => {
    if (!value) return null;
    if (Array.isArray(value)) return value.length ? value.join(', ') : null;
    return value;
};

// Shared panel + label primitives so the whole page reads as one system.
const PANEL =
    'overflow-hidden rounded-lg border border-border bg-surface-secondary shadow-sm';
const PANEL_HEAD =
    'flex items-center justify-between gap-3 border-b border-border bg-surface-tertiary/50 px-6 py-4';
const PANEL_TITLE = 'font-display text-sm font-semibold text-fg-primary';
const PANEL_EYEBROW =
    'text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700';
const MICRO_LABEL =
    'text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-fg-tertiary';
const PRIMARY_BTN =
    'inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0';
const TEXTAREA =
    'block w-full rounded-lg border border-border-medium bg-surface-secondary px-3 py-2 text-[0.8125rem] text-fg-primary placeholder:text-fg-tertiary shadow-sm transition focus:border-primary-600 focus:outline-none focus:ring-[3px] focus:ring-primary-600/15';

// A data table that lays field label/value pairs out as rows.
function DetailTable({ rows }) {
    return (
        <table className="w-full text-left text-[0.8125rem]">
            <tbody className="divide-y divide-border">
                {rows.map((row) => (
                    <tr key={row.label} className="align-top">
                        <th
                            scope="row"
                            className={`w-52 whitespace-nowrap bg-surface-tertiary/40 px-6 py-3 text-left align-top ${MICRO_LABEL}`}
                        >
                            {row.label}
                        </th>
                        <td className="px-6 py-3 font-medium leading-relaxed text-fg-primary">
                            {row.value !== null && row.value !== undefined && row.value !== '' ? (
                                row.value
                            ) : (
                                <span className="font-normal italic text-fg-tertiary">Not specified</span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// docs/4.4-audit-trail-status-tracking.md — applicants see a simplified progress tracker,
// internal reviewers see full status + comment history. This page shows the full history to
// everyone with view access (docs/0.2 already gates who can view the record at all); a
// simplified applicant-only view is a follow-up, not built here.
export default function Show({ application, legalTransitions, revisions }) {
    const { auth, errors: pageErrors } = usePage().props;
    const roleName = auth.roleName;
    const isOwner = application.applicant_id === auth.user.id;
    // The approve action posts via router.post (not a useForm), so its server-side guard errors
    // (NDA not signed / outstanding required items) land in the shared error bag under `nda`.
    const approveError = pageErrors?.nda;

    const returnForm = useForm({ comments: '' });
    const signForm = useForm({ typed_full_name: '', signature_image: null, obligations_accepted: false });
    const memberForm = useForm({ full_name: '', email: '' });
    const transferForm = useForm({ new_leader_email: '' });

    // C2 (concerns 9/10) — approval is a plain confirm; rejection requires a reason AND the acting
    // DPO's own password, both collected in one SweetAlert and re-verified server-side.
    const handleApprove = async () => {
        const ok = await confirmAction({
            title: 'Approve this application?',
            text: 'Approval opens the Research Team NDA for signing. The DPO clearance is issued once every researcher has signed.',
            confirmText: 'Approve',
        });
        if (ok) router.post(route('dpreq.approve', application.id), { expected_version: application.version });
    };
    const handleReject = async () => {
        const result = await confirmWithPassword({
            title: 'Reject this application?',
            text: 'This cannot be undone. State the reason and enter your account password to confirm.',
            confirmText: 'Reject',
            reasonLabel: 'Rejection reason',
        });
        if (!result) return;
        router.post(
            route('dpreq.reject', application.id),
            { reason: result.reason, password: result.password },
            { preserveScroll: true, onError: (errs) => notifyResultError('Could not reject', errs.password || errs.reason || 'Please try again.') },
        );
    };

    // C3 — route the remaining workflow buttons through the shared SweetAlert helpers instead of
    // firing silently (start review / resubmit) or using the native confirm() (member removal).
    const handleStartReview = async () => {
        const ok = await confirmAction({ title: 'Begin reviewing this application?', text: 'It will move to “Under Review” and the applicant will be notified.', confirmText: 'Start Review' });
        if (ok) router.post(route('dpreq.start-review', application.id));
    };
    const handleResubmit = async () => {
        const ok = await confirmAction({ title: 'Resubmit this application?', text: 'It will go back to the DPO for review.', confirmText: 'Resubmit' });
        if (ok) router.post(route('dpreq.resubmit', application.id));
    };
    const handleResendMember = async (s) => {
        const ok = await confirmAction({ title: 'Resend signing link?', text: `A fresh Research Team NDA signing link will be emailed to ${s.full_name}.`, confirmText: 'Resend' });
        if (ok) router.post(route('dpreq.nda.members.resend', [application.id, s.id]), {}, { preserveScroll: true, onSuccess: () => notifySuccess('Signing link resent') });
    };
    const handleRemoveMember = async (s) => {
        const ok = await confirmDanger({ title: 'Remove team member?', text: `${s.full_name} will be removed from the team NDA. This cannot be undone.`, confirmText: 'Remove' });
        if (ok) router.delete(route('dpreq.nda.members.remove', [application.id, s.id]), { preserveScroll: true, onSuccess: () => notifySuccess('Member removed') });
    };

    const research = application.research_application ?? {};
    const nda = research.research_team_nda;

    // The uploaded intake documents live across both tracks (mandatory uploads on the REMIS sibling,
    // additional docs on DPREQ). Merge them, excluding generated system PDFs which have their own UI
    // (concern 5/6, 2026-07-28).
    const submittedDocuments = [
        ...(application.documents ?? []),
        ...(research.remis_application?.documents ?? []),
    ].filter((d) => !GENERATED_DOC_TYPES.includes(d.document_type));
    const form1Document = (application.documents ?? []).find(
        (d) => d.document_type === 'Form1Application' && d.status === 'current',
    );
    const mySignatory = nda?.signatories?.find((s) => s.user_id === auth.user.id);
    // Team leader (application owner) manages co-members while the NDA is still gathering signatures.
    const canManageMembers = isOwner && nda?.status === 'pending_signatures';

    // DPO Approver was retired as a separate role — dpo_staff now owns the DPO track end to
    // end, including final approval.
    const canScreenerAct = roleName === 'dpo_staff';

    const isEmployeeApplicant = (research.applicant_category ?? 'student') === 'employee';
    const applicantRows = [
        { label: 'Applicant', value: application.applicant?.name },
        { label: 'Applicant Type', value: titleCase(application.applicant_type) },
        { label: 'Filing As', value: titleCase(research.applicant_category) ?? 'Student' },
        { label: 'Adviser', value: research.adviser_name },
        { label: 'Researchers', value: research.researcher_count },
        { label: isEmployeeApplicant ? 'Department / Office' : 'Department', value: research.department ?? application.department },
        // Employees give a Position; students give Level/Course/Section (stakeholder 2026-07-28).
        ...(isEmployeeApplicant
            ? [{ label: 'Position', value: research.position }]
            : [
                { label: 'Level', value: research.level },
                { label: 'Course', value: research.course },
                { label: 'Section', value: research.section },
            ]),
    ];

    const studyRows = [
        { label: 'Respondents', value: research.respondents },
        { label: 'Target Respondents', value: research.target_respondent_count },
        { label: 'Collection Method', value: titleCase(research.data_collection_method) },
        { label: 'Capturing Tool', value: titleCase(research.data_capturing_tool) },
        { label: 'Duration Start', value: formatDate(research.target_start_date) },
        { label: 'Duration End', value: formatDate(research.target_end_date) },
        { label: 'Minors Involved', value: yesNo(research.minors_involved) },
        { label: 'Head Letter Approved', value: yesNo(research.respondent_head_letter_approved) },
    ];

    const dpoRows = [
        { label: 'Purpose', value: application.purpose },
        { label: 'Personal Data Types', value: asList(application.data_types) },
        { label: 'Data Subjects', value: asList(application.data_subjects) },
        { label: 'Retention Plan', value: application.retention_plan },
        { label: '3rd-Party Sharing', value: yesNo(application.third_party_sharing) },
        ...(application.third_party_sharing
            ? [{ label: '3rd-Party Detail', value: application.third_party_detail }]
            : []),
    ];

    // DPO clearance is issued independently of the Ethics track (stakeholder-additional-features.md).
    const clearanceIssued = Boolean(research.clearance_certificate?.dpreq_issued_at);

    const isAdmin = roleName === 'system_administrator';

    const hasWorkflowActions =
        (canScreenerAct && application.status === 'submitted') ||
        (isOwner && application.status === 'returned') ||
        (canScreenerAct && application.status === 'under_review') ||
        isAdmin ||
        (legalTransitions.length === 0 && !canScreenerAct);

    return (
        <AuthenticatedLayout>
            <Head title={application.tracking_number} />

            <div className="py-8 font-sans text-fg-primary [font-optical-sizing:auto]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="mb-8 border-b border-border pb-6">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <p className={PANEL_EYEBROW}>DPREQ Application</p>
                                    <span className="text-border-medium">/</span>
                                    <span className="font-display text-xs font-semibold tabular-nums text-fg-tertiary">
                                        {application.tracking_number}
                                    </span>
                                </div>
                                <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">
                                    {research.research_title || (
                                        <span className="text-fg-tertiary">Untitled Application</span>
                                    )}
                                </h1>
                                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-tertiary">
                                    <span className="font-medium text-fg-secondary">
                                        {application.applicant?.name || 'Unknown applicant'}
                                    </span>
                                    <span className="text-border-medium">•</span>
                                    <StatusBadge
                                        status={application.status}
                                        label={STATUS_LABELS[application.status]}
                                    />
                                    {research.target_start_date && (
                                        <>
                                            <span className="text-border-medium">•</span>
                                            <span>
                                                {formatDate(research.target_start_date)} —{' '}
                                                {formatDate(research.target_end_date) || 'Ongoing'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <a
                                    href={route('dpreq.form-pdf', application.id)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-border-medium bg-surface-secondary px-4 py-2 text-[0.8125rem] font-semibold text-fg-secondary shadow-sm transition hover:border-border-medium hover:bg-surface-tertiary active:translate-y-px"
                                >
                                    Download Form 1
                                </a>
                                {isOwner && ['draft', 'returned'].includes(application.status) && (
                                    <Link
                                        href={route('dpreq.edit', application.id)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-border-medium bg-surface-secondary px-4 py-2 text-[0.8125rem] font-semibold text-fg-secondary shadow-sm transition hover:bg-surface-tertiary active:translate-y-px"
                                    >
                                        Edit
                                    </Link>
                                )}
                                {canScreenerAct && application.status === 'submitted' && (
                                    <button
                                        onClick={handleStartReview}
                                        className={PRIMARY_BTN}
                                    >
                                        Start Review
                                    </button>
                                )}
                                {isOwner && application.status === 'returned' && (
                                    <button
                                        onClick={handleResubmit}
                                        className={PRIMARY_BTN}
                                    >
                                        Resubmit
                                    </button>
                                )}
                                {canScreenerAct && application.status === 'under_review' && (
                                    <button
                                        onClick={handleApprove}
                                        className={PRIMARY_BTN}
                                    >
                                        Approve
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Two-column body */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* LEFT COLUMN */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Revision / additional-requirement requests (item 7 · FRS §IX) */}
                            {revisions && (revisions.items.length > 0 || revisions.canRaise) && (
                                <div className={PANEL}>
                                    <div className="p-6">
                                        <RevisionPanel revisions={revisions} />
                                    </div>
                                </div>
                            )}

                            {/* Section A — Applicant Information */}
                            <div className={PANEL}>
                                <div className={PANEL_HEAD}>
                                    <div>
                                        <p className={PANEL_EYEBROW}>Section A</p>
                                        <h3 className={PANEL_TITLE}>Applicant Information</h3>
                                    </div>
                                </div>
                                <DetailTable rows={applicantRows} />
                            </div>

                            {/* Section B — Study Information */}
                            <div className={PANEL}>
                                <div className={PANEL_HEAD}>
                                    <div>
                                        <p className={PANEL_EYEBROW}>Section B</p>
                                        <h3 className={PANEL_TITLE}>Study Information</h3>
                                    </div>
                                </div>
                                <DetailTable rows={studyRows} />
                            </div>

                            {/* DPO Review Information */}
                            <div className={PANEL}>
                                <div className={PANEL_HEAD}>
                                    <div>
                                        <p className={PANEL_EYEBROW}>Privacy</p>
                                        <h3 className={PANEL_TITLE}>DPO Review Information</h3>
                                    </div>
                                </div>
                                <DetailTable rows={dpoRows} />
                            </div>

                            {/* Generated Documents — Form 1 (auto-generated PDF), kept separate from
                                the applicant's uploads (concern 6, 2026-07-28). */}
                            <div className={PANEL}>
                                <div className={PANEL_HEAD}>
                                    <div>
                                        <p className={PANEL_EYEBROW}>Generated</p>
                                        <h3 className={PANEL_TITLE}>Form 1</h3>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 px-6 py-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-fg-primary">Form 1 — Application</p>
                                        <p className="mt-0.5 truncate text-xs text-fg-tertiary">
                                            Auto-generated from this application
                                            {form1Document?.version ? ` · v${form1Document.version}` : ''}
                                        </p>
                                    </div>
                                    <a
                                        href={route('dpreq.form-pdf', application.id)}
                                        className="inline-flex shrink-0 items-center rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-medium text-fg-secondary shadow-sm transition hover:border-border-medium hover:bg-surface-tertiary hover:text-fg-primary active:translate-y-px"
                                    >
                                        Download
                                    </a>
                                </div>
                            </div>

                            {/* Submitted Documents (concern 5/8) — the applicant's uploaded files
                                across both tracks, each labelled by type. */}
                            {submittedDocuments.length > 0 && (
                                <div className={PANEL}>
                                    <div className={PANEL_HEAD}>
                                        <div>
                                            <p className={PANEL_EYEBROW}>Attachments</p>
                                            <h3 className={PANEL_TITLE}>Submitted Documents</h3>
                                        </div>
                                    </div>
                                    <ul className="divide-y divide-border">
                                        {submittedDocuments.map((d) => (
                                            <li key={d.id} className="flex items-center justify-between gap-3 px-6 py-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-sm font-medium text-fg-primary">
                                                            {documentLabel(d.document_type)}
                                                        </p>
                                                    </div>
                                                    <p className="mt-0.5 truncate text-xs text-fg-tertiary">
                                                        {d.original_filename}
                                                        {d.uploaded_by?.name ? ` · ${d.uploaded_by.name}` : ''}
                                                        {d.created_at ? ` · ${formatDate(d.created_at)}` : ''}
                                                    </p>
                                                </div>
                                                <a
                                                    href={route('documents.download', d.id)}
                                                    className="inline-flex shrink-0 items-center rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-medium text-fg-secondary shadow-sm transition hover:border-border-medium hover:bg-surface-tertiary hover:text-fg-primary active:translate-y-px"
                                                >
                                                    Download
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Research Team NDA */}
                            {nda && (
                                <div className={PANEL}>
                                    <div className={PANEL_HEAD}>
                                        <div>
                                            <p className={PANEL_EYEBROW}>Form 2</p>
                                            <h3 className={PANEL_TITLE}>Research Team NDA</h3>
                                            <div className="mt-1 flex items-center gap-2 text-xs">
                                                <span className="font-medium tabular-nums text-fg-tertiary">
                                                    {nda.tracking_number}
                                                </span>
                                                <span className="text-border-medium">•</span>
                                                <span
                                                    className={`font-medium ${nda.status === 'completed'
                                                        ? 'text-emerald-700'
                                                        : 'text-amber-700'
                                                        }`}
                                                >
                                                    {nda.status === 'completed'
                                                        ? 'Fully Signed'
                                                        : titleCase(nda.status)}
                                                </span>
                                            </div>
                                        </div>
                                        {nda.documents && nda.documents.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={route('dpreq.nda-pdf', application.id)}
                                                    className="inline-flex items-center rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-medium text-fg-secondary shadow-sm transition hover:border-border-medium hover:bg-surface-tertiary hover:text-fg-primary active:translate-y-px"
                                                >
                                                    Download
                                                </a>
                                                <a
                                                    href={route('documents.versions.index', {
                                                        documentableType: 'App\\Modules\\Dpreq\\Models\\DpreqApplication',
                                                        documentableId: application.id,
                                                        document_type: 'nda_pdf',
                                                    })}
                                                    className="inline-flex items-center rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-medium text-fg-secondary shadow-sm transition hover:border-border-medium hover:bg-surface-tertiary hover:text-fg-primary active:translate-y-px"
                                                >
                                                    Version History
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-inset ring-amber-200/70">
                                            <p className="text-xs leading-relaxed text-amber-900">
                                                This NDA must be fully signed before DPO Staff can approve the
                                                application.
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
                                                            className={`flex items-center justify-between rounded-lg px-3 py-2.5 ring-1 ring-inset ${s.signed_at
                                                                ? 'bg-emerald-50/60 ring-emerald-200/70'
                                                                : 'bg-surface-tertiary ring-border'
                                                                }`}
                                                        >
                                                            <div>
                                                                <p className="text-[0.8125rem] font-medium text-fg-primary">
                                                                    {s.full_name}
                                                                </p>
                                                                <p className="text-xs text-fg-tertiary">{s.role}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-right">
                                                                {s.signed_at ? (
                                                                    <span className="text-xs font-medium tabular-nums text-emerald-700">
                                                                        Signed {formatDate(s.signed_at)}
                                                                    </span>
                                                                ) : s.invited_at ? (
                                                                    <span className="text-xs font-medium text-amber-600">
                                                                        Invited{s.token_expires_at && new Date(s.token_expires_at) < new Date() ? ' · link expired' : ''}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs font-medium text-fg-tertiary">
                                                                        Pending
                                                                    </span>
                                                                )}
                                                                {canManageMembers && s.role !== 'leader' && !s.signed_at && (
                                                                    <span className="flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleResendMember(s)}
                                                                            className="text-xs font-semibold text-primary-700 hover:underline"
                                                                        >
                                                                            Resend
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveMember(s)}
                                                                            className="text-xs font-semibold text-red-600 hover:underline"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg bg-surface-tertiary py-6 text-center ring-1 ring-inset ring-border">
                                                    <p className="text-xs text-fg-tertiary">
                                                        No signatories assigned yet.
                                                    </p>
                                                </div>
                                            )}

                                            {canManageMembers && (
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        memberForm.post(route('dpreq.nda.members.add', application.id), {
                                                            preserveScroll: true,
                                                            onSuccess: () => memberForm.reset(),
                                                        });
                                                    }}
                                                    className="mt-3 space-y-2 rounded-lg bg-surface-tertiary p-3 ring-1 ring-inset ring-border"
                                                >
                                                    <p className="text-xs font-medium text-fg-secondary">
                                                        Add a co-researcher — they'll get a unique email link to sign.
                                                    </p>
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        <div>
                                                            <TextInput
                                                                className="w-full text-sm"
                                                                placeholder="Full name"
                                                                value={memberForm.data.full_name}
                                                                onChange={(e) => memberForm.setData('full_name', e.target.value)}
                                                            />
                                                            <InputError message={memberForm.errors.full_name} className="mt-1" />
                                                        </div>
                                                        <div>
                                                            <TextInput
                                                                type="email"
                                                                className="w-full text-sm"
                                                                placeholder="Email address"
                                                                value={memberForm.data.email}
                                                                onChange={(e) => memberForm.setData('email', e.target.value)}
                                                            />
                                                            <InputError message={memberForm.errors.email} className="mt-1" />
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={memberForm.processing || !memberForm.data.full_name || !memberForm.data.email}
                                                        className="inline-flex items-center gap-1.5 rounded-md bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {memberForm.processing ? 'Sending…' : 'Add member & send link'}
                                                    </button>
                                                </form>
                                            )}
                                        </div>

                                        {/* Sign NDA */}
                                        {mySignatory && !mySignatory.signed_at && (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    signForm.post(route('dpreq.sign-nda', application.id));
                                                }}
                                                className="mt-5 space-y-3 rounded-lg bg-primary-50 p-4 ring-1 ring-inset ring-primary-200/70"
                                            >
                                                <h4 className="text-[0.8125rem] font-semibold text-fg-primary">
                                                    Sign this NDA
                                                </h4>

                                                {/* Form 2 — OBLIGATIONS OF THE RESEARCHER/S. The signer must
                                                    review and accept all eight obligations before signing. */}
                                                <div className="rounded-lg border border-primary-200 bg-white p-3">
                                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-secondary">
                                                        Obligations of the Researcher/s
                                                    </p>
                                                    <ol className="list-decimal space-y-1 pl-4 text-[0.6875rem] leading-relaxed text-fg-secondary">
                                                        <li>I will use the data gathered solely for the purpose of conducting the study.</li>
                                                        <li>I will not disclose, publish, or otherwise disseminate confidential information to any third party without the prior written consent of the school.</li>
                                                        <li>I shall not use the information for any commercial, personal, or other unauthorized purpose.</li>
                                                        <li>I will anonymize participants&rsquo; identities and responses and will keep it confidential.</li>
                                                        <li>I will maintain reasonable security measures in the storage such as password protected files or other appropriate measures.</li>
                                                        <li>I will avoid exposing participants to harm or risk.</li>
                                                        <li>Upon completion of the study, I will return or destroy all confidential information and all copies at the school&rsquo;s request.</li>
                                                        <li>I will promptly share a copy of the study in PDF form by uploading it in the EDMS, if the school requests it.</li>
                                                    </ol>
                                                    <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-md bg-primary-50 p-2.5 ring-1 ring-inset ring-primary-200">
                                                        <input
                                                            type="checkbox"
                                                            checked={signForm.data.obligations_accepted}
                                                            onChange={(e) => signForm.setData('obligations_accepted', e.target.checked)}
                                                            className="mt-0.5 h-4 w-4 rounded border-primary-300 text-primary-700 focus:ring-primary-600"
                                                        />
                                                        <span className="text-xs font-medium leading-snug text-fg-primary">
                                                            I have read and agree to abide by all Obligations of the Researcher/s listed above.
                                                        </span>
                                                    </label>
                                                    <InputError message={signForm.errors.obligations_accepted} className="mt-1" />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-fg-secondary">
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
                                                    <label className="block text-xs font-medium text-fg-secondary">
                                                        Signature
                                                    </label>
                                                    <SignaturePad
                                                        onChange={(image) => signForm.setData('signature_image', image)}
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={signForm.processing || !signForm.data.obligations_accepted}
                                                    className={`${PRIMARY_BTN} disabled:cursor-not-allowed disabled:opacity-50`}
                                                >
                                                    {signForm.processing ? 'Signing…' : 'Sign NDA'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Workflow Actions */}
                            {hasWorkflowActions && (
                                <div className={PANEL}>
                                    <div className={PANEL_HEAD}>
                                        <div>
                                            <p className={PANEL_EYEBROW}>Review</p>
                                            <h3 className={PANEL_TITLE}>Workflow Actions</h3>
                                        </div>
                                    </div>

                                    <div className="space-y-4 p-6">
                                        {/* Start Review */}
                                        {canScreenerAct && application.status === 'submitted' && (
                                            <button
                                                onClick={handleStartReview}
                                                className={PRIMARY_BTN}
                                            >
                                                Start Review
                                            </button>
                                        )}

                                        {/* Under-review actions: Return for Correction */}
                                        {canScreenerAct && application.status === 'under_review' && (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    returnForm.post(route('dpreq.return', application.id));
                                                }}
                                                className="space-y-3 rounded-lg bg-red-50 p-4 ring-1 ring-inset ring-red-200"
                                            >
                                                <h4 className="text-[0.8125rem] font-semibold text-fg-primary">
                                                    Return for Correction
                                                </h4>
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-fg-secondary">
                                                        Comments <span className="text-red-600">*</span>
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        className={TEXTAREA}
                                                        placeholder="Describe what needs to be corrected…"
                                                        value={returnForm.data.comments}
                                                        onChange={(e) =>
                                                            returnForm.setData('comments', e.target.value)
                                                        }
                                                    />
                                                    <InputError message={returnForm.errors.comments} />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={returnForm.processing}
                                                    className="inline-flex items-center rounded-lg bg-red-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-red-800 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0"
                                                >
                                                    {returnForm.processing ? 'Returning…' : 'Return for Correction'}
                                                </button>
                                            </form>
                                        )}

                                        {/* Resubmit */}
                                        {isOwner && application.status === 'returned' && (
                                            <div className="rounded-lg bg-primary-50 p-4 ring-1 ring-inset ring-primary-200/70">
                                                <h4 className="text-[0.8125rem] font-semibold text-fg-primary">
                                                    Ready to Resubmit?
                                                </h4>
                                                <p className="mb-3 mt-1 text-xs text-fg-secondary">
                                                    Once you've addressed the feedback, resubmit your application for
                                                    review.
                                                </p>
                                                <button
                                                    onClick={handleResubmit}
                                                    className={PRIMARY_BTN}
                                                >
                                                    Resubmit Application
                                                </button>
                                            </div>
                                        )}

                                        {/* Reject */}
                                        {canScreenerAct && application.status === 'under_review' && (
                                            <div className="space-y-3 rounded-lg bg-red-50 p-4 ring-1 ring-inset ring-red-200">
                                                <h4 className="text-[0.8125rem] font-semibold text-fg-primary">
                                                    Reject Application
                                                </h4>
                                                <p className="text-xs text-fg-secondary">
                                                    You'll be asked for a reason and your account password to confirm.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={handleReject}
                                                    className="inline-flex items-center rounded-lg bg-red-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-red-800 active:translate-y-px"
                                                >
                                                    Reject Application
                                                </button>
                                            </div>
                                        )}

                                        {/* Approve */}
                                        {canScreenerAct && application.status === 'under_review' && (
                                            <div className="rounded-lg bg-emerald-50 p-4 ring-1 ring-inset ring-emerald-200">
                                                <h4 className="text-[0.8125rem] font-semibold text-fg-primary">
                                                    Final Approval
                                                </h4>
                                                <p className="mb-3 mt-1 text-xs text-fg-secondary">
                                                    Approving opens the Research Team NDA for the team to sign; the clearance is issued once everyone has signed.
                                                </p>
                                                {approveError && (
                                                    <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                                                        {approveError}
                                                    </p>
                                                )}
                                                <button
                                                    onClick={handleApprove}
                                                    className="inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:translate-y-px"
                                                >
                                                    Approve Application
                                                </button>
                                            </div>
                                        )}

                                        {/* Transfer ownership (admin only, B3 / concern 3.4) */}
                                        {isAdmin && ['rejected'].includes(application.status) === false && (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    transferForm.post(route('dpreq.transfer-ownership', application.id), {
                                                        preserveScroll: true,
                                                        onSuccess: () => transferForm.reset(),
                                                    });
                                                }}
                                                className="space-y-3 rounded-lg bg-amber-50 p-4 ring-1 ring-inset ring-amber-200"
                                            >
                                                <h4 className="text-[0.8125rem] font-semibold text-fg-primary">
                                                    Transfer Ownership
                                                </h4>
                                                <p className="text-xs text-fg-secondary">
                                                    Reassign this application to a new lead (e.g. the current lead left the
                                                    school). Submitted documents and signatures are preserved; the previous
                                                    lead's account is deactivated.
                                                </p>
                                                <input
                                                    type="email"
                                                    placeholder="New lead's account email"
                                                    className={TEXTAREA}
                                                    value={transferForm.data.new_leader_email}
                                                    onChange={(e) => transferForm.setData('new_leader_email', e.target.value)}
                                                />
                                                <InputError message={transferForm.errors.new_leader_email} />
                                                <button
                                                    type="submit"
                                                    disabled={transferForm.processing}
                                                    className="inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-amber-800 active:translate-y-px disabled:opacity-50"
                                                >
                                                    {transferForm.processing ? 'Transferring…' : 'Transfer Ownership'}
                                                </button>
                                            </form>
                                        )}

                                        {/* No actions */}
                                        {legalTransitions.length === 0 && !canScreenerAct && !isAdmin && (
                                            <div className="rounded-lg bg-surface-tertiary p-4 ring-1 ring-inset ring-border">
                                                <h4 className="text-[0.8125rem] font-semibold text-fg-primary">
                                                    No Actions Available
                                                </h4>
                                                <p className="mt-1 text-xs text-fg-secondary">
                                                    This application is in a terminal state. No further actions can be
                                                    taken.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6 space-y-6">
                                {/* Overview */}
                                <div className={PANEL}>
                                    <div className={PANEL_HEAD}>
                                        <div>
                                            <p className={PANEL_EYEBROW}>Summary</p>
                                            <h3 className={PANEL_TITLE}>Overview</h3>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-border p-6">
                                        <div className="pb-4">
                                            <dt className={`mb-1.5 ${MICRO_LABEL}`}>Status</dt>
                                            <dd>
                                                <StatusBadge
                                                    status={application.status}
                                                    label={STATUS_LABELS[application.status]}
                                                />
                                            </dd>
                                        </div>
                                        <div className="py-4">
                                            <dt className={`mb-1.5 ${MICRO_LABEL}`}>Applicant Type</dt>
                                            <dd className="text-[0.8125rem] font-medium text-fg-primary">
                                                {titleCase(application.applicant_type) || (
                                                    <span className="font-normal italic text-fg-tertiary">
                                                        Not specified
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="py-4">
                                            <dt className={`mb-1.5 ${MICRO_LABEL}`}>Submitted</dt>
                                            <dd className="text-[0.8125rem] font-medium tabular-nums text-fg-primary">
                                                {formatDate(application.created_at) || '—'}
                                            </dd>
                                        </div>

                                        {clearanceIssued && (
                                            <div className="pt-4">
                                                <dt className={`mb-2 ${MICRO_LABEL}`}>Clearance Certificate</dt>
                                                <a
                                                    href={route('dpreq.clearance-pdf', application.id)}
                                                    className="inline-flex w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.8125rem] font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 active:translate-y-px"
                                                >
                                                    Download Form 3
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status History */}
                                <div className={PANEL}>
                                    <div className={PANEL_HEAD}>
                                        <div>
                                            <p className={PANEL_EYEBROW}>Audit</p>
                                            <h3 className={PANEL_TITLE}>Status History</h3>
                                        </div>
                                        <span className="rounded-md bg-surface-tertiary px-2 py-1 text-xs font-semibold tabular-nums text-fg-secondary">
                                            {application.status_history?.length ?? 0}
                                        </span>
                                    </div>

                                    <div className="p-6">
                                        {application.status_history && application.status_history.length > 0 ? (
                                            <div className="space-y-1">
                                                {application.status_history.map((h, index) => (
                                                    <div key={h.id} className="group relative flex gap-3">
                                                        {/* Timeline line */}
                                                        {index !== application.status_history.length - 1 && (
                                                            <div className="absolute left-[5px] top-4 h-[calc(100%-4px)] w-px bg-border" />
                                                        )}

                                                        {/* Dot */}
                                                        <div className="relative flex-shrink-0 pt-1.5">
                                                            <div className="size-2.5 rounded-full bg-primary-600 ring-4 ring-primary-100" />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 pb-5">
                                                            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                                                <span className="inline-block rounded-md bg-surface-tertiary px-2 py-0.5 text-[0.6875rem] font-medium capitalize text-fg-secondary">
                                                                    {(h.from_status ?? 'new').replaceAll('_', ' ')}
                                                                </span>
                                                                <span className="text-border-medium">→</span>
                                                                <span className="inline-block rounded-md bg-primary-100 px-2 py-0.5 text-[0.6875rem] font-semibold capitalize text-primary-900">
                                                                    {(h.to_status ?? '').replaceAll('_', ' ')}
                                                                </span>
                                                            </div>

                                                            <p className="text-xs font-medium text-fg-secondary">
                                                                {h.changed_by?.name ?? 'System'}
                                                            </p>
                                                            <time className="text-xs tabular-nums text-fg-tertiary">
                                                                {h.created_at
                                                                    ? new Date(h.created_at).toLocaleString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                        hour: 'numeric',
                                                                        minute: '2-digit',
                                                                    })
                                                                    : 'N/A'}
                                                            </time>

                                                            {h.comments && (
                                                                <div className="mt-2 rounded-lg bg-surface-tertiary px-3 py-2 ring-1 ring-inset ring-border">
                                                                    <p className="text-xs italic leading-relaxed text-fg-secondary">
                                                                        &ldquo;{h.comments}&rdquo;
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="py-6 text-center text-xs text-fg-tertiary">
                                                No status history yet.
                                            </p>
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
