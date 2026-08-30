import InputError from '@/Components/InputError';
import PageHeader from '@/Components/PageHeader';
import RevisionPanel from '@/Components/RevisionPanel';
import StatusBadge from '@/Components/StatusBadge';
import CertificateHistory from '@/Components/CertificateHistory';
import TextInput from '@/Components/TextInput';
import SignaturePad from '@/Components/SignaturePad';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { confirmAction, promptPassword, notifyResultError } from '@/lib/confirm';
import {
    ArrowRight,
    ClipboardText,
    Clock,
    DownloadSimple,
    Flask,
    HourglassMedium,
    PaperPlaneTilt,
    Prohibit,
    User,
    Users,
    Warning,
} from '@phosphor-icons/react';

const STATUS_LABELS = {
    draft_submitted: 'Draft Submitted',
    under_endorsement: 'Under Endorsement',
    for_screening: 'For Screening',
    for_revision: 'For Revision',
    for_review: 'For Review',
    approved: 'Approved',
    approved_with_conditions: 'Approved with Conditions',
    exempted: 'Exempted',
    deferred: 'Deferred',
    disapproved: 'Disapproved',
    clearance_issued: 'Clearance Issued',
    monitoring: 'Monitoring',
    monitoring_paused: 'Monitoring Paused',
    closed: 'Closed',
    archived: 'Archived',
};

// A4 (concern 5) — readable labels for the stored document_type of Form-1 / report uploads.
const DOCUMENT_TYPE_LABELS = {
    Form1Application: 'Form 1 — Application',
    ResearchProposal: 'Research Proposal',
    ConsentForm: 'Consent Form',
    Instrument: 'Data Collection Instrument',
    AdditionalDocument: 'Additional Document',
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
// Generated system documents (own UI / download buttons) — kept OUT of the uploaded list.
const GENERATED_DOC_TYPES = [
    'Form1Application', 'nda_pdf',
    'DpreqClearanceCertificate', 'RemisClearanceCertificate', 'RemisExemptionCertificate',
];
const documentLabel = (type) => DOCUMENT_TYPE_LABELS[type] ?? String(type ?? '').replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
const DOC_STATUS_STYLES = {
    current: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    superseded: 'bg-surface-tertiary text-fg-secondary ring-border',
    archived: 'bg-amber-50 text-amber-700 ring-amber-200',
};
const fmtDocDate = (v) => (v ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '');

const COMPLIANCE_LABELS = {
    compliant: 'Compliant',
    minor_issues: 'Minor Issues',
    major_issues: 'Major Issues',
    non_compliant: 'Non-Compliant',
};

// Helper functions to format field values
const formatStudyType = (type) => {
    if (!type) return null;
    const map = {
        'thesis_dissertation': 'Thesis or Dissertation',
        'faculty_research': 'Faculty Research',
        'student_research': 'Student Research',
        'institutional_research': 'Institutional Research',
        'collaborative_research': 'Collaborative Research',
    };
    return map[type] || type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatFieldValue = (value) => {
    if (!value) return null;
    if (typeof value !== 'string') return value;
    // Capitalize first letter of each word, replace underscores with spaces
    return value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const fieldClass =
    'block w-full rounded-md border-border-medium shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors text-xs';

// Every workflow action panel shares one flat, neutral treatment. Distinguishing
// an endorsement from a screening from a decision is done with the icon + heading,
// not with a different accent color per action — a single maroon accent stays the
// one thing that reads as "brand/primary action" on the page.
const panelClass = 'p-4 bg-surface-tertiary border border-border rounded-lg space-y-3';

// Themed SweetAlert2 confirmation for the one truly irreversible action on this
// page (submitting the Final Ethics Completion Report closes and archives the study).
function confirmIrreversible({ title, text, confirmText }) {
    return Swal.fire({
        icon: 'warning',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        reverseButtons: true,
        customClass: {
            popup: 'rounded-lg border border-border shadow-sm',
            confirmButton:
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--color-danger,#B23A2E)] hover:brightness-90 text-white text-xs font-semibold mr-2',
            cancelButton:
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-surface-tertiary hover:bg-surface-tertiary text-fg-secondary text-xs font-semibold',
        },
    });
}

function WorkflowEmptyState({ variant, statusLabel }) {
    const isTerminal = variant === 'terminal';
    const Icon = isTerminal ? Prohibit : HourglassMedium;
    const title = isTerminal ? 'No Actions Available' : 'Nothing Needs Your Attention';
    const description = isTerminal
        ? 'This application is in a terminal state and no further actions can be taken.'
        : `This application is currently "${statusLabel}". It isn't awaiting action from you right now.`;

    return (
        <div className="flex flex-col items-center gap-2 text-center py-10 px-5 bg-surface-tertiary border border-border rounded-lg">
            <Icon size={28} weight="regular" className="text-fg-tertiary" />
            <p className="text-sm font-semibold text-fg-primary">{title}</p>
            <p className="text-xs text-fg-tertiary max-w-sm">{description}</p>
        </div>
    );
}

// Label/value pair used by the Applicant & Study information cards (mirrors DPREQ's DetailTable).
function DetailPair({ label, value }) {
    const empty = value === null || value === undefined || value === '';
    return (
        <div>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-tertiary">{label}</dt>
            <dd className="text-sm font-medium leading-relaxed text-fg-primary">
                {empty ? <span className="font-normal italic text-fg-tertiary">Not specified</span> : value}
            </dd>
        </div>
    );
}

export default function Show({ application, legalTransitions, revisions }) {
    const { auth } = usePage().props;
    const roleName = auth.roleName;
    const isApplicant = application.applicant_id === auth.user.id;
    const reviewAssignments = application.review_assignments ?? [];
    const myAssignment = reviewAssignments.find((ra) => ra.reviewer_id === auth.user.id);
    const isAssignedReviewer = !!myAssignment;
    const allReviewersSubmitted = reviewAssignments.length > 0 && reviewAssignments.every((ra) => ra.submitted_at);

    // Shared research context + documents (concern 5/6, 2026-07-28). The mandatory intake uploads are
    // on this REMIS record; the additional (DPO-side) uploads and generated Form 1 are on the DPREQ
    // sibling — merge for the "Submitted Documents" list and separate the generated Form 1.
    const research = application.research_application ?? {};
    const dpreqSibling = research.dpreq_application ?? {};
    const submittedDocuments = [
        ...(application.documents ?? []),
        ...(dpreqSibling.documents ?? []),
    ].filter((d) => !GENERATED_DOC_TYPES.includes(d.document_type));
    const form1Document = (dpreqSibling.documents ?? []).find(
        (d) => d.document_type === 'Form1Application' && d.status === 'current',
    );
    const isEmployeeApplicant = (research.applicant_category ?? 'student') === 'employee';

    const canEndorse =
        (application.current_endorsement_step === 'adviser' && roleName === 'adviser') ||
        (application.current_endorsement_step === 'program_head' && roleName === 'program_head') ||
        (application.current_endorsement_step === 'dean' && roleName === 'dean');

    const canResubmit = isApplicant && application.status === 'for_revision';
    const canScreen = roleName === 'ethics_secretariat' && application.status === 'for_screening';
    const canAssignReviewer = roleName === 'ethics_committee_chair' && application.status === 'for_review';
    const canReview = isAssignedReviewer && application.status === 'for_review' && !myAssignment?.submitted_at;
    const canDecide =
        roleName === 'ethics_committee_chair' && application.status === 'for_review' && allReviewersSubmitted;
    const canReactivate = roleName === 'ethics_committee_chair' && application.status === 'deferred';
    const canResumeMonitoring = isApplicant && application.status === 'monitoring_paused';

    const hasAnyWorkflowAction = canEndorse || canResubmit || canScreen || canAssignReviewer || canReview || canDecide || canReactivate || canResumeMonitoring;

    const endorseForm = useForm({ action: 'approve', remarks: '', signature: '', signature_image: null });

    // C2 (concern 10) — rejecting an endorsement / disapproving requires the acting reviewer's own
    // password. Remarks are already on the form, so only the password is prompted, injected for the
    // one submit via transform() and cleared afterward.
    const submitEndorse = async (e) => {
        e.preventDefault();
        if (endorseForm.data.action !== 'reject') {
            endorseForm.post(route('remis.endorse', application.id));
            return;
        }
        const password = await promptPassword({ title: 'Reject this endorsement?', text: 'Enter your account password to confirm.', confirmText: 'Reject' });
        if (!password) return;
        endorseForm.transform((d) => ({ ...d, password })).post(route('remis.endorse', application.id), {
            onError: (errs) => errs.password && notifyResultError('Could not reject', errs.password),
            onFinish: () => endorseForm.transform((d) => d),
        });
    };
    const submitDecide = async (e) => {
        e.preventDefault();
        if (decideForm.data.outcome !== 'disapproved') {
            decideForm.post(route('remis.decide', application.id));
            return;
        }
        const password = await promptPassword({ title: 'Disapprove this application?', text: 'Enter your account password to confirm.', confirmText: 'Disapprove' });
        if (!password) return;
        decideForm.transform((d) => ({ ...d, password })).post(route('remis.decide', application.id), {
            onError: (errs) => errs.password && notifyResultError('Could not disapprove', errs.password),
            onFinish: () => decideForm.transform((d) => d),
        });
    };
    // FRS §VI five-item screening checklist.
    const screenForm = useForm({
        decision: 'complete',
        comments: '',
        checklist: {
            proposal_attached: false,
            consent_form_attached: false,
            instrument_attached: false,
            signatures_complete: false,
            required_templates_used: false,
        },
    });
    const SCREEN_ITEMS = {
        proposal_attached: 'Proposal attached',
        consent_form_attached: 'Consent form attached',
        instrument_attached: 'Instrument attached',
        signatures_complete: 'Signatures complete',
        required_templates_used: 'Required templates used',
    };
    const assignForm = useForm({ reviewer_email: '' });
    // FRS §VIII seven review criteria.
    const REVIEW_CRITERIA = {
        voluntary_participation: 'Voluntary Participation',
        informed_consent: 'Informed Consent',
        protection_from_harm: 'Protection from Harm',
        confidentiality: 'Confidentiality',
        participant_selection: 'Participant Selection',
        privacy_protection: 'Privacy Protection',
        ethical_acceptability: 'Ethical Acceptability',
    };
    const reviewForm = useForm({
        risk_level: 'minimal',
        rationale: '',
        recommendation: 'approve',
        comments: '',
        criteria: Object.fromEntries(Object.keys(REVIEW_CRITERIA).map((k) => [k, { verdict: 'met', comment: '' }])),
    });
    // expected_version round-trips the record version this page was rendered from, so the server
    // can reject a decision submitted from a page another user has already superseded
    // (App\Shared\Concurrency\Concerns\ChecksRecordVersion).
    const decideForm = useForm({ outcome: 'approved', conditions: '', remarks: '', signature: '', signature_image: null, expected_version: application.version });

    const progressForm = useForm({
        status_of_study: '', participants_recruited: '', ethics_concerns: '',
        protocol_deviations: '', corrective_actions: '', documents: [],
    });
    const completionForm = useForm({
        completion_date: '', final_participant_count: '', compliance_statement: '',
        publication_status: '', data_storage_location: '', documents: [],
    });
    const [reviewDrafts, setReviewDrafts] = useState({});
    const reviewDraft = (id) => reviewDrafts[id] ?? { compliance_status: 'compliant', review_notes: '' };
    const setReviewDraft = (id, patch) =>
        setReviewDrafts((prev) => ({ ...prev, [id]: { ...reviewDraft(id), ...patch } }));

    const handleCompletionSubmit = (e) => {
        e.preventDefault();
        confirmIrreversible({
            title: 'Submit Final Completion Report?',
            text: 'This closes and archives the study. This cannot be undone.',
            confirmText: 'Submit & Archive',
        }).then((result) => {
            if (result.isConfirmed) {
                completionForm.post(route('remis.completion-report.store', application.id), {
                    forceFormData: true,
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={Flask}
                    title={application.tracking_number}
                    description={application.research_application?.research_title}
                />
            }
        >
            <Head title={application.tracking_number} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    {/* Slim top bar — Stripe-style: identity + status inline */}
                    <div className="mb-6 border-b border-border pb-5">
                        <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-fg-tertiary">
                            <Flask size={14} className="text-primary-700" weight="regular" />
                            {application.tracking_number}
                        </div>
                        <h1 className="mb-2 font-display text-xl font-semibold leading-tight text-fg-primary">
                            {application.research_application?.research_title || (
                                <span className="text-fg-tertiary">Untitled Research</span>
                            )}
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-fg-tertiary">
                            <div className="flex items-center gap-1.5">
                                <User size={14} weight="regular" className="text-fg-tertiary" />
                                {application.research_application?.applicant?.name || 'Unknown'}
                            </div>
                            <span className="text-border-medium">•</span>
                            <StatusBadge status={application.status} label={STATUS_LABELS[application.status]} />
                            {application.current_endorsement_step && (
                                <>
                                    <span className="text-border-medium">•</span>
                                    <span>Awaiting {application.current_endorsement_step.replace('_', ' ')}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Applicant Information (mirrors DPREQ Show) */}
                            <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                <div className="border-b border-border bg-surface-tertiary/50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-fg-primary">Applicant Information</h3>
                                </div>
                                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 md:grid-cols-2">
                                    <DetailPair label="Applicant" value={research.applicant?.name} />
                                    <DetailPair label="Filing As" value={formatFieldValue(research.applicant_category) ?? 'Student'} />
                                    <DetailPair label="Adviser" value={research.adviser_name} />
                                    <DetailPair label="Researchers" value={research.researcher_count} />
                                    <DetailPair label={isEmployeeApplicant ? 'Department / Office' : 'Department'} value={research.department} />
                                    {isEmployeeApplicant ? (
                                        <DetailPair label="Position" value={research.position} />
                                    ) : (
                                        <>
                                            <DetailPair label="Level" value={research.level} />
                                            <DetailPair label="Course" value={research.course} />
                                            <DetailPair label="Section" value={research.section} />
                                        </>
                                    )}
                                </dl>
                                <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
                                    <a
                                        href={route('incidents.create', application.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600/10 border border-red-600/20 hover:bg-red-600/20 text-red-700 text-xs font-medium transition-colors"
                                    >
                                        <Warning size={14} weight="regular" />
                                        Report Incident
                                    </a>
                                </div>
                            </div>

                            {/* Study Information — ethics/REMIS study details (no DPO-only info) */}
                            <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                <div className="border-b border-border bg-surface-tertiary/50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-fg-primary">Study Information</h3>
                                </div>
                                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 md:grid-cols-2">
                                    <DetailPair label="Study Type" value={formatStudyType(application.study_type)} />
                                    <DetailPair label="Study Design" value={formatFieldValue(application.study_design)} />
                                    <DetailPair label="Target Population" value={application.target_population} />
                                    <DetailPair label="Participant Count" value={application.participant_count} />
                                    <DetailPair label="Vulnerable Population" value={application.vulnerable_population ? 'Yes' : 'No'} />
                                    <DetailPair label="Study Site(s)" value={application.study_sites} />
                                    <DetailPair label="Funding Source" value={application.funding_source} />
                                    <DetailPair label="Inclusion Criteria" value={application.inclusion_criteria} />
                                    <DetailPair label="Exclusion Criteria" value={application.exclusion_criteria} />
                                    <DetailPair label="Risks to Participants" value={application.risks_to_participants} />
                                    <DetailPair label="Benefits" value={application.benefits} />
                                    <DetailPair label="Confidentiality Measures" value={application.confidentiality_measures} />
                                    <DetailPair label="Consent Process" value={application.consent_process} />
                                    <DetailPair label="Data Storage Plan" value={application.data_storage_plan} />
                                </dl>
                            </div>

                            {/* Generated Documents — Form 1 (separate from uploads) */}
                            <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                <div className="border-b border-border bg-surface-tertiary/50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-fg-primary">Form 1</h3>
                                </div>
                                <div className="flex items-center justify-between gap-3 px-5 py-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-fg-primary">Form 1 — Application</p>
                                        <p className="mt-0.5 truncate text-xs text-fg-tertiary">
                                            Auto-generated{form1Document?.version ? ` · v${form1Document.version}` : ''}
                                        </p>
                                    </div>
                                    {form1Document && (
                                        <a
                                            href={route('documents.download', form1Document.id)}
                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-medium text-fg-secondary shadow-sm transition hover:border-border-medium hover:bg-surface-tertiary hover:text-fg-primary active:translate-y-px"
                                        >
                                            <DownloadSimple size={14} weight="regular" />
                                            Download
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Endorsement Chain Card */}
                            <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                <div className="border-b border-border bg-surface-tertiary/50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-fg-primary">Endorsement Chain</h3>
                                </div>
                                <div className="p-5">
                                    {(!application.endorsement_actions || application.endorsement_actions.length === 0) ? (
                                        <div className="text-center py-6 bg-surface-tertiary rounded-lg border border-border">
                                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-tertiary mb-2">
                                                <ClipboardText size={20} weight="regular" className="text-fg-tertiary" />
                                            </div>
                                            <p className="text-xs text-fg-tertiary">No endorsement actions yet.</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {application.endorsement_actions.map((e) => (
                                                <li key={e.id} className="p-3 bg-surface-tertiary border border-border rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-fg-primary capitalize">
                                                                {e.step.replace('_', ' ')}
                                                            </p>
                                                            <p className="text-xs text-fg-secondary mt-0.5">
                                                                <span className="font-medium">{e.action}</span> by {e.endorser?.name || 'Unknown'}
                                                            </p>
                                                            {e.remarks && (
                                                                <p className="text-xs text-fg-secondary mt-1 italic">&ldquo;{e.remarks}&rdquo;</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Submitted Documents — applicant uploads across both tracks (concern 5/6) */}
                            {submittedDocuments.length > 0 && (
                                <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                    <div className="border-b border-border bg-surface-tertiary/50 px-5 py-3">
                                        <h3 className="text-sm font-semibold text-fg-primary">Submitted Documents</h3>
                                    </div>
                                    <ul className="divide-y divide-border">
                                        {submittedDocuments.map((d) => (
                                            <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-fg-primary">{documentLabel(d.document_type)}</p>
                                                    <p className="mt-0.5 truncate text-xs text-fg-tertiary">
                                                        {d.original_filename}
                                                        {d.uploaded_by?.name ? ` · ${d.uploaded_by.name}` : ''}
                                                        {d.created_at ? ` · ${fmtDocDate(d.created_at)}` : ''}
                                                    </p>
                                                </div>
                                                <a
                                                    href={route('documents.download', d.id)}
                                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-medium text-fg-secondary shadow-sm transition hover:border-border-medium hover:bg-surface-tertiary hover:text-fg-primary active:translate-y-px"
                                                >
                                                    <DownloadSimple size={14} weight="regular" />
                                                    Download
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Revision Requests Card (FRS §IX) */}
                            {revisions && (revisions.items.length > 0 || revisions.canRaise) && (
                                <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                    <div className="p-5">
                                        <RevisionPanel revisions={revisions} />
                                    </div>
                                </div>
                            )}

                            {/* Review Panel Card */}
                            {reviewAssignments.length > 0 && (
                                <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                    <div className="border-b border-border bg-surface-tertiary/50 px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                                                <Users size={16} weight="regular" className="text-primary-700" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-fg-primary">Review Panel</h3>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        {/* Conflict warning when reviewers disagree on risk level */}
                                        {(() => {
                                            const submittedAssignments = reviewAssignments.filter((ra) => ra.submitted_at);
                                            const riskLevels = submittedAssignments
                                                .map((ra) => ra.risk_classification?.level)
                                                .filter(Boolean);
                                            const uniqueRiskLevels = [...new Set(riskLevels)];
                                            const hasConflict = uniqueRiskLevels.length > 1;

                                            return hasConflict ? (
                                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                                                    <div className="flex items-start gap-2">
                                                        <Warning size={16} weight="regular" className="text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-amber-900">
                                                                Reviewer disagreement detected
                                                            </p>
                                                            <p className="mt-1 text-xs text-amber-800">
                                                                Reviewers classified this study at different risk levels:{' '}
                                                                {uniqueRiskLevels.map((l) => l.replace('_', ' ')).join(', ')}.
                                                                The most recent classification will be used. Consider discussing with the panel before issuing a decision.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null;
                                        })()}

                                        <ul className="space-y-2">
                                            {reviewAssignments.map((ra) => (
                                                <li key={ra.id} className="rounded-lg border border-border p-3">
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-fg-primary">{ra.reviewer?.name || 'Unknown Reviewer'}</p>
                                                            {ra.submitted_at ? (
                                                                <>
                                                                    <p className="mt-1 text-xs text-fg-secondary">
                                                                        <span className="font-medium">Recommendation:</span>{' '}
                                                                        <span className="capitalize">{ra.recommendation?.replace('_', ' ')}</span>
                                                                    </p>
                                                                    {ra.risk_classification && (
                                                                        <p className="mt-1 text-xs text-fg-secondary">
                                                                            <span className="font-medium">Risk Level:</span>{' '}
                                                                            <span className="capitalize">{ra.risk_classification.level.replace('_', ' ')}</span>
                                                                            {ra.risk_classification.review_type && (
                                                                                <span className="text-fg-tertiary"> ({ra.risk_classification.review_type.replace('_', ' ')})</span>
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                    {ra.comments && (
                                                                        <p className="mt-1 text-xs text-fg-secondary italic">&ldquo;{ra.comments}&rdquo;</p>
                                                                    )}
                                                                    <p className="mt-1 text-xs text-fg-tertiary">
                                                                        Submitted {new Date(ra.submitted_at).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                <p className="mt-1 text-xs text-fg-tertiary italic">Recommendation pending</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Consolidation view for the Chair when all reviewers have submitted */}
                                        {canDecide && allReviewersSubmitted && (
                                            <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50/30 p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ClipboardText size={16} weight="regular" className="text-primary-700" />
                                                    <h4 className="text-sm font-semibold text-fg-primary">Consolidated Review Summary</h4>
                                                </div>
                                                <div className="space-y-2 text-xs">
                                                    {reviewAssignments.map((ra) => (
                                                        <div key={ra.id} className="flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2 border border-border">
                                                            <span className="font-medium text-fg-primary">{ra.reviewer?.name || 'Unknown'}</span>
                                                            <span className="text-fg-secondary">
                                                                {ra.risk_classification?.level.replace('_', ' ') || 'No classification'} →{' '}
                                                                <span className="capitalize">{ra.recommendation?.replace('_', ' ')}</span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-xs text-fg-tertiary">
                                                    All {reviewAssignments.length} reviewer(s) have submitted. You may now issue a decision.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Monitoring & Completion Card */}
                            {['monitoring', 'monitoring_paused', 'closed', 'archived'].includes(application.status) && (
                                <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                    <div className="border-b border-border bg-surface-tertiary/50 px-6 py-4">
                                        <h3 className="text-lg font-semibold text-fg-primary">Monitoring &amp; Completion</h3>
                                    </div>
                                    <div className="p-6">
                                        {application.status === 'monitoring_paused' && (
                                            <div className="mb-6 p-4 border rounded-lg bg-surface-tertiary border-border">
                                                <div className="flex items-start gap-3">
                                                    <Warning size={20} weight="fill" className="mt-0.5 shrink-0 text-primary-700" />
                                                    <div className="text-sm">
                                                        <p className="font-semibold text-fg-primary">Monitoring is paused.</p>
                                                        <p className="mt-1 text-fg-secondary">
                                                            A Data Breach or Confidentiality Breach incident was filed for this
                                                            study, so monitoring was automatically paused. Progress reports are
                                                            suspended until monitoring is resumed.
                                                        </p>
                                                        {canResumeMonitoring && (
                                                            <form
                                                                className="mt-3"
                                                                onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    router.post(route('remis.resume-monitoring', application.id));
                                                                }}
                                                            >
                                                                <button
                                                                    type="submit"
                                                                    disabled={router.processing}
                                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold shadow-sm transition-colors"
                                                                >
                                                                    <ArrowRight size={16} weight="regular" />
                                                                    Resume Monitoring
                                                                </button>
                                                            </form>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {application.completion_report && (
                                            <div className="mb-6 p-4 bg-surface-tertiary border border-border rounded-lg text-sm">
                                                <p className="font-semibold text-fg-primary">
                                                    Final Ethics Completion Report — {application.completion_report.final_outcome}
                                                </p>
                                                <p className="text-fg-secondary">Completion Date: {application.completion_report.completion_date}</p>
                                                <p className="text-fg-secondary">Final Participant Count: {application.completion_report.final_participant_count}</p>
                                                <p className="text-fg-secondary">Publication Status: {application.completion_report.publication_status}</p>
                                                <p className="text-fg-secondary">Data Storage Location: {application.completion_report.data_storage_location}</p>
                                                <p className="mt-1 text-fg-secondary">{application.completion_report.compliance_statement}</p>
                                                {application.completion_report.archived_at && (
                                                    <p className="mt-2 text-xs text-fg-tertiary">
                                                        Archived at {application.completion_report.archived_at}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <h4 className="mb-3 text-sm font-semibold text-fg-secondary uppercase tracking-wider">Progress Reports</h4>
                                        <ul className="mb-6 space-y-3">
                                            {(application.progress_reports ?? []).length === 0 && (
                                                <li className="text-sm text-fg-tertiary">No progress reports submitted yet.</li>
                                            )}
                                            {(application.progress_reports ?? []).map((r) => (
                                                <li key={r.id} className="rounded-lg border border-border p-4 text-sm">
                                                    <p><span className="font-semibold text-fg-primary">Status of Study:</span> {r.status_of_study}</p>
                                                    <p><span className="font-semibold text-fg-primary">Participants Recruited:</span> {r.participants_recruited}</p>
                                                    {r.ethics_concerns && <p><span className="font-semibold text-fg-primary">Ethics Concerns:</span> {r.ethics_concerns}</p>}
                                                    {r.protocol_deviations && <p><span className="font-semibold text-fg-primary">Protocol Deviations:</span> {r.protocol_deviations}</p>}
                                                    {r.corrective_actions && <p><span className="font-semibold text-fg-primary">Corrective Actions:</span> {r.corrective_actions}</p>}
                                                    <p className="mt-1 text-xs text-fg-tertiary">
                                                        Submitted by {r.submitter?.name} at {r.submitted_at}
                                                    </p>

                                                    {r.compliance_status ? (
                                                        <p className="mt-2 text-sm text-fg-secondary">
                                                            <span className="font-semibold">Compliance:</span>{' '}
                                                            {COMPLIANCE_LABELS[r.compliance_status] ?? r.compliance_status}
                                                            {r.review_notes && ` — "${r.review_notes}"`}
                                                            <span className="ml-1 text-xs text-fg-tertiary">
                                                                (reviewed by {r.reviewer?.name})
                                                            </span>
                                                        </p>
                                                    ) : isAssignedReviewer && (
                                                        <form
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                router.post(route('remis.progress-reports.review', r.id), reviewDraft(r.id), {
                                                                    preserveScroll: true,
                                                                });
                                                            }}
                                                            className="mt-3 space-y-2 border-t border-border pt-3"
                                                        >
                                                            <select
                                                                className={fieldClass}
                                                                value={reviewDraft(r.id).compliance_status}
                                                                onChange={(e) => setReviewDraft(r.id, { compliance_status: e.target.value })}
                                                            >
                                                                <option value="compliant">Compliant</option>
                                                                <option value="minor_issues">Minor Issues</option>
                                                                <option value="major_issues">Major Issues</option>
                                                                <option value="non_compliant">Non-Compliant</option>
                                                            </select>
                                                            <textarea
                                                                className={fieldClass}
                                                                placeholder="Review notes"
                                                                value={reviewDraft(r.id).review_notes}
                                                                onChange={(e) => setReviewDraft(r.id, { review_notes: e.target.value })}
                                                            />
                                                            <button
                                                                type="submit"
                                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold shadow-sm transition-colors"
                                                            >
                                                                <ClipboardText size={16} weight="regular" />
                                                                Log Compliance Review
                                                            </button>
                                                        </form>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>

                                        {isApplicant && application.status === 'monitoring' && (
                                            <div className="space-y-6 border-t border-border pt-6">
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        progressForm.post(route('remis.progress-reports.store', application.id), {
                                                            forceFormData: true,
                                                            onSuccess: () => progressForm.reset(),
                                                        });
                                                    }}
                                                    className="p-5 bg-surface-tertiary border border-border rounded-lg space-y-3"
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <PaperPlaneTilt size={18} weight="regular" className="text-primary-700" />
                                                        <h4 className="text-base font-semibold text-fg-primary">Submit Progress Report</h4>
                                                    </div>
                                                    <TextInput
                                                        className="block w-full"
                                                        placeholder="Status of study"
                                                        value={progressForm.data.status_of_study}
                                                        onChange={(e) => progressForm.setData('status_of_study', e.target.value)}
                                                    />
                                                    <TextInput
                                                        type="number"
                                                        className="block w-full"
                                                        placeholder="Participants recruited"
                                                        value={progressForm.data.participants_recruited}
                                                        onChange={(e) => progressForm.setData('participants_recruited', e.target.value)}
                                                    />
                                                    <textarea
                                                        className={fieldClass}
                                                        placeholder="Ethics concerns (optional)"
                                                        value={progressForm.data.ethics_concerns}
                                                        onChange={(e) => progressForm.setData('ethics_concerns', e.target.value)}
                                                    />
                                                    <textarea
                                                        className={fieldClass}
                                                        placeholder="Protocol deviations (optional)"
                                                        value={progressForm.data.protocol_deviations}
                                                        onChange={(e) => progressForm.setData('protocol_deviations', e.target.value)}
                                                    />
                                                    <textarea
                                                        className={fieldClass}
                                                        placeholder="Corrective actions (optional)"
                                                        value={progressForm.data.corrective_actions}
                                                        onChange={(e) => progressForm.setData('corrective_actions', e.target.value)}
                                                    />
                                                    <input
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => progressForm.setData('documents', Array.from(e.target.files))}
                                                        className="block w-full text-sm text-fg-secondary"
                                                    />
                                                    <InputError message={progressForm.errors.progress_report} />
                                                    <button
                                                        type="submit"
                                                        disabled={progressForm.processing}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <PaperPlaneTilt size={16} weight="regular" />
                                                        {progressForm.processing ? 'Submitting...' : 'Submit Progress Report'}
                                                    </button>
                                                </form>

                                                <form
                                                    onSubmit={handleCompletionSubmit}
                                                    className="p-5 bg-[var(--color-warning-bg,#FBF0DE)] border border-[var(--color-warning,#A66A1D)]/40 rounded-lg space-y-3"
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Warning size={18} weight="regular" className="text-[var(--color-warning-text,#6B4512)]" />
                                                        <h4 className="text-base font-semibold text-fg-primary">
                                                            Submit Final Ethics Completion Report
                                                        </h4>
                                                    </div>
                                                    <p className="text-xs text-[var(--color-warning-text,#6B4512)]">
                                                        Submitting this closes and archives the study — this cannot be undone.
                                                    </p>
                                                    <TextInput
                                                        type="date"
                                                        className="block w-full"
                                                        value={completionForm.data.completion_date}
                                                        onChange={(e) => completionForm.setData('completion_date', e.target.value)}
                                                    />
                                                    <TextInput
                                                        type="number"
                                                        className="block w-full"
                                                        placeholder="Final participant count"
                                                        value={completionForm.data.final_participant_count}
                                                        onChange={(e) => completionForm.setData('final_participant_count', e.target.value)}
                                                    />
                                                    <textarea
                                                        className={fieldClass}
                                                        placeholder="Compliance statement"
                                                        value={completionForm.data.compliance_statement}
                                                        onChange={(e) => completionForm.setData('compliance_statement', e.target.value)}
                                                    />
                                                    <TextInput
                                                        className="block w-full"
                                                        placeholder="Publication status"
                                                        value={completionForm.data.publication_status}
                                                        onChange={(e) => completionForm.setData('publication_status', e.target.value)}
                                                    />
                                                    <TextInput
                                                        className="block w-full"
                                                        placeholder="Data storage location"
                                                        value={completionForm.data.data_storage_location}
                                                        onChange={(e) => completionForm.setData('data_storage_location', e.target.value)}
                                                    />
                                                    <input
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => completionForm.setData('documents', Array.from(e.target.files))}
                                                        className="block w-full text-sm text-fg-secondary"
                                                    />
                                                    <InputError message={completionForm.errors.completion_report} />
                                                    <button
                                                        type="submit"
                                                        disabled={completionForm.processing}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--color-warning,#A66A1D)] hover:brightness-90 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Warning size={16} weight="regular" />
                                                        {completionForm.processing ? 'Submitting...' : 'Submit Completion Report'}
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions Card */}
                            <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                <div className="border-b border-border bg-surface-tertiary/50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-fg-primary">Workflow Actions</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    {canEndorse && (
                                        <form
                                            onSubmit={submitEndorse}
                                            className={panelClass}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <PaperPlaneTilt size={16} weight="regular" className="text-primary-700" />
                                                <h4 className="text-sm font-semibold text-fg-primary">Submit Endorsement</h4>
                                            </div>
                                            <select
                                                className={fieldClass}
                                                value={endorseForm.data.action}
                                                onChange={(e) => endorseForm.setData('action', e.target.value)}
                                            >
                                                <option value="approve">Approve (forward to next endorser)</option>
                                                <option value="return">Return with Comments</option>
                                                <option value="reject">Reject</option>
                                            </select>
                                            <textarea
                                                rows="3"
                                                className={fieldClass}
                                                placeholder="Remarks"
                                                value={endorseForm.data.remarks}
                                                onChange={(e) => endorseForm.setData('remarks', e.target.value)}
                                            />
                                            <TextInput
                                                className="block w-full text-xs"
                                                placeholder="Type your full name to sign"
                                                value={endorseForm.data.signature}
                                                onChange={(e) => endorseForm.setData('signature', e.target.value)}
                                            />
                                            <SignaturePad onChange={(image) => endorseForm.setData('signature_image', image)} />
                                            <InputError message={endorseForm.errors.endorse} />
                                            <button
                                                type="submit"
                                                disabled={endorseForm.processing}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <PaperPlaneTilt size={14} weight="regular" />
                                                {endorseForm.processing ? 'Submitting...' : 'Submit Endorsement'}
                                            </button>
                                        </form>
                                    )}

                                    {canResubmit && (
                                        <div className={panelClass}>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <PaperPlaneTilt size={16} weight="regular" className="text-primary-700" />
                                                <h4 className="text-sm font-semibold text-fg-primary">Ready to Resubmit?</h4>
                                            </div>
                                            <p className="text-xs text-fg-secondary">
                                                Once you've addressed the feedback, resubmit your application for review.
                                            </p>
                                            <button
                                                onClick={async () => {
                                                    const ok = await confirmAction({ title: 'Resubmit this application?', text: 'It will go back to the ethics review chain.', confirmText: 'Resubmit' });
                                                    if (ok) router.post(route('remis.resubmit', application.id));
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold shadow-sm transition-colors"
                                            >
                                                <PaperPlaneTilt size={14} weight="regular" />
                                                Resubmit
                                            </button>
                                        </div>
                                    )}

                                    {canScreen && (
                                        <form
                                            onSubmit={(e) => { e.preventDefault(); screenForm.post(route('remis.screen', application.id)); }}
                                            className={panelClass}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <ClipboardText size={16} weight="regular" className="text-primary-700" />
                                                <h4 className="text-sm font-semibold text-fg-primary">Submit Screening</h4>
                                            </div>
                                            <div className="space-y-1.5 rounded-md bg-surface-tertiary p-3">
                                                <p className="text-xs font-semibold text-fg-secondary">Completeness checklist</p>
                                                {Object.entries(SCREEN_ITEMS).map(([key, label]) => (
                                                    <label key={key} className="flex items-center gap-2 text-xs text-fg-secondary">
                                                        <input
                                                            type="checkbox"
                                                            checked={screenForm.data.checklist[key]}
                                                            onChange={(e) => screenForm.setData('checklist', { ...screenForm.data.checklist, [key]: e.target.checked })}
                                                            className="rounded border-border-medium text-primary-700"
                                                        />
                                                        {label}
                                                    </label>
                                                ))}
                                            </div>
                                            <select
                                                className={fieldClass}
                                                value={screenForm.data.decision}
                                                onChange={(e) => screenForm.setData('decision', e.target.value)}
                                            >
                                                <option value="complete">Complete</option>
                                                <option value="incomplete">Incomplete</option>
                                                <option value="returned_for_compliance">Returned for Compliance</option>
                                            </select>
                                            <textarea
                                                rows="3"
                                                className={fieldClass}
                                                placeholder="Comments"
                                                value={screenForm.data.comments}
                                                onChange={(e) => screenForm.setData('comments', e.target.value)}
                                            />
                                            <button
                                                type="submit"
                                                disabled={screenForm.processing}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <PaperPlaneTilt size={14} weight="regular" />
                                                {screenForm.processing ? 'Submitting...' : 'Submit Screening'}
                                            </button>
                                        </form>
                                    )}

                                    {canAssignReviewer && (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                assignForm.post(route('remis.assign-reviewer', application.id), {
                                                    onSuccess: () => assignForm.reset(),
                                                });
                                            }}
                                            className={panelClass}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Users size={18} weight="regular" className="text-primary-700" />
                                                <h4 className="text-base font-semibold text-fg-primary">
                                                    {reviewAssignments.length === 0 ? 'Assign Reviewer' : 'Assign Another Reviewer'}
                                                </h4>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <TextInput
                                                        className="block w-full"
                                                        type="email"
                                                        placeholder="Ethics Reviewer email"
                                                        value={assignForm.data.reviewer_email}
                                                        onChange={(e) => assignForm.setData('reviewer_email', e.target.value)}
                                                    />
                                                    <InputError message={assignForm.errors.reviewer_email} className="mt-2" />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={assignForm.processing}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <PaperPlaneTilt size={16} weight="regular" />
                                                    Assign
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {canReview && (
                                        <form
                                            onSubmit={(e) => { e.preventDefault(); reviewForm.post(route('remis.submit-review', application.id)); }}
                                            className={panelClass}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <ClipboardText size={18} weight="regular" className="text-primary-700" />
                                                <h4 className="text-base font-semibold text-fg-primary">Risk Classification &amp; Review</h4>
                                            </div>
                                            <div className="space-y-2 rounded-md bg-surface-tertiary p-3">
                                                <p className="text-xs font-semibold text-fg-secondary">Ethics review criteria (FRS §VIII)</p>
                                                {Object.entries(REVIEW_CRITERIA).map(([key, label]) => (
                                                    <div key={key} className="flex items-center justify-between gap-2">
                                                        <span className="text-xs text-fg-secondary">{label}</span>
                                                        <select
                                                            value={reviewForm.data.criteria[key].verdict}
                                                            onChange={(e) => reviewForm.setData('criteria', { ...reviewForm.data.criteria, [key]: { ...reviewForm.data.criteria[key], verdict: e.target.value } })}
                                                            className="rounded-md border-border-medium text-xs shadow-sm"
                                                        >
                                                            <option value="met">Met</option>
                                                            <option value="concerns">Concerns</option>
                                                            <option value="not_met">Not met</option>
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                            <select
                                                className={fieldClass}
                                                value={reviewForm.data.risk_level}
                                                onChange={(e) => reviewForm.setData('risk_level', e.target.value)}
                                            >
                                                <option value="minimal">Minimal Risk (Expedited)</option>
                                                <option value="moderate">Moderate Risk (Committee)</option>
                                                <option value="high">High Risk (Full Board)</option>
                                            </select>
                                            <textarea
                                                className={fieldClass}
                                                placeholder="Classification rationale"
                                                value={reviewForm.data.rationale}
                                                onChange={(e) => reviewForm.setData('rationale', e.target.value)}
                                            />
                                            <select
                                                className={fieldClass}
                                                value={reviewForm.data.recommendation}
                                                onChange={(e) => reviewForm.setData('recommendation', e.target.value)}
                                            >
                                                <option value="approve">Approve</option>
                                                <option value="minor_revision">Minor Revision</option>
                                                <option value="major_revision">Major Revision</option>
                                                <option value="disapprove">Disapprove</option>
                                            </select>
                                            <textarea
                                                className={fieldClass}
                                                placeholder="Review comments"
                                                value={reviewForm.data.comments}
                                                onChange={(e) => reviewForm.setData('comments', e.target.value)}
                                            />
                                            <button
                                                type="submit"
                                                disabled={reviewForm.processing}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <PaperPlaneTilt size={16} weight="regular" />
                                                {reviewForm.processing ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </form>
                                    )}

                                    {canDecide && (
                                        <form
                                            onSubmit={submitDecide}
                                            className={panelClass}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Warning size={18} weight="regular" className="text-primary-700" />
                                                <h4 className="text-base font-semibold text-fg-primary">Issue Decision</h4>
                                            </div>
                                            <select
                                                className={fieldClass}
                                                value={decideForm.data.outcome}
                                                onChange={(e) => decideForm.setData('outcome', e.target.value)}
                                            >
                                                <option value="approved">Approved</option>
                                                <option value="approved_with_conditions">Approved with Conditions</option>
                                                <option value="exempted">Exempted (Certificate of Exemption)</option>
                                                <option value="deferred">Deferred</option>
                                                <option value="for_revision">Return for Revision</option>
                                                <option value="disapproved">Disapproved</option>
                                            </select>
                                            {decideForm.data.outcome === 'approved_with_conditions' && (
                                                <textarea
                                                    className={fieldClass}
                                                    placeholder="Conditions"
                                                    value={decideForm.data.conditions}
                                                    onChange={(e) => decideForm.setData('conditions', e.target.value)}
                                                />
                                            )}
                                            <textarea
                                                className={fieldClass}
                                                placeholder="Remarks"
                                                value={decideForm.data.remarks}
                                                onChange={(e) => decideForm.setData('remarks', e.target.value)}
                                            />
                                            <TextInput
                                                className="block w-full"
                                                placeholder="Type your full name to sign"
                                                value={decideForm.data.signature}
                                                onChange={(e) => decideForm.setData('signature', e.target.value)}
                                            />
                                            <SignaturePad onChange={(image) => decideForm.setData('signature_image', image)} />
                                            <InputError message={decideForm.errors.decide} />
                                            <button
                                                type="submit"
                                                disabled={decideForm.processing}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Warning size={16} weight="regular" />
                                                {decideForm.processing ? 'Submitting...' : 'Issue Decision'}
                                            </button>
                                        </form>
                                    )}

                                    {canReactivate && (
                                        <form
                                            onSubmit={(e) => { e.preventDefault(); router.post(route('remis.reactivate', application.id)); }}
                                            className={panelClass}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <ArrowRight size={18} weight="regular" className="text-amber-600" />
                                                <h4 className="text-base font-semibold text-zinc-900">Reactivate for Review</h4>
                                            </div>
                                            <p className="text-sm text-zinc-600 mb-3">This application was deferred. Reactivating it will return it to the review queue.</p>
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-sm transition-colors"
                                            >
                                                <ArrowRight size={16} weight="regular" />
                                                Reactivate
                                            </button>
                                        </form>
                                    )}

                                    {!hasAnyWorkflowAction && (
                                        <WorkflowEmptyState
                                            variant={legalTransitions.length === 0 ? 'terminal' : 'waiting'}
                                            statusLabel={STATUS_LABELS[application.status]}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* END LEFT COLUMN */}

                        {/* RIGHT COLUMN */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6 space-y-6">
                                {/* Overview (mirrors DPREQ Show) */}
                                <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                    <div className="border-b border-border bg-surface-tertiary/50 px-5 py-4">
                                        <h3 className="text-base font-semibold text-fg-primary">Overview</h3>
                                    </div>
                                    <div className="divide-y divide-border p-5">
                                        <div className="pb-4">
                                            <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-tertiary">Status</dt>
                                            <dd><StatusBadge status={application.status} label={STATUS_LABELS[application.status]} /></dd>
                                        </div>
                                        <div className="py-4">
                                            <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-tertiary">Tracking Number</dt>
                                            <dd className="text-sm font-medium tabular-nums text-fg-primary">{application.tracking_number}</dd>
                                        </div>
                                        {application.current_endorsement_step && (
                                            <div className="py-4">
                                                <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-tertiary">Awaiting</dt>
                                                <dd className="text-sm font-medium capitalize text-fg-primary">{application.current_endorsement_step.replace('_', ' ')}</dd>
                                            </div>
                                        )}
                                        {Boolean(research.clearance_certificate?.remis_issued_at) && (
                                            <div className="pt-4">
                                                <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-tertiary">
                                                    {research.clearance_certificate?.remis_certificate_kind === 'exemption' ? 'Certificate of Exemption' : 'Ethics Clearance'}
                                                </dt>
                                                <a
                                                    href={route('remis.clearance-pdf', application.id)}
                                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.8125rem] font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 active:translate-y-px"
                                                >
                                                    <DownloadSimple size={15} weight="regular" />
                                                    Download Certificate
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Certificate Issuance History (stakeholder Future Enhancement, 2026-08-31) */}
                                <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                    <div className="border-b border-border bg-surface-tertiary/50 px-5 py-4">
                                        <h3 className="text-base font-semibold text-fg-primary flex items-center gap-2">
                                            <Clock size={18} weight="regular" className="text-fg-secondary" />
                                            Certificate History
                                        </h3>
                                    </div>
                                    <div className="p-5">
                                        <CertificateHistory certificate={application.research_application?.clearance_certificate} />
                                    </div>
                                </div>

                                {/* Status History */}
                                <div className="bg-surface-secondary rounded-lg border border-border shadow-sm overflow-hidden">
                                    <div className="border-b border-border bg-surface-tertiary/50 px-5 py-4">
                                        <h3 className="text-base font-semibold text-fg-primary flex items-center gap-2">
                                            <Clock size={18} weight="regular" className="text-fg-secondary" />
                                            Status History
                                        </h3>
                                    </div>

                                    <div className="p-5">
                                        {application.status_history && application.status_history.length > 0 ? (
                                            <div className="space-y-4">
                                                {application.status_history.map((h, index) => (
                                                    <div key={h.id} className="relative flex gap-3 group">
                                                        {index !== application.status_history.length - 1 && (
                                                            <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-surface-tertiary group-hover:bg-primary-200 transition-colors"></div>
                                                        )}

                                                        <div className="relative flex-shrink-0">
                                                            <div className="w-8 h-8 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center group-hover:bg-primary-200 group-hover:border-primary-300 transition-colors">
                                                                <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 pt-0 pb-4">
                                                            <div className="space-y-1.5 mb-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-surface-tertiary text-fg-secondary">
                                                                        {h.from_status ?? 'new'}
                                                                    </span>
                                                                    <ArrowRight size={12} weight="regular" className="text-fg-tertiary" />
                                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-primary-100 text-primary-900">
                                                                        {h.to_status}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="text-xs text-fg-secondary space-y-0.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <User size={12} weight="regular" className="text-fg-tertiary" />
                                                                    <span className="font-medium text-fg-secondary">{h.changed_by?.name ?? 'System'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-fg-tertiary">
                                                                    <Clock size={12} weight="regular" className="text-fg-tertiary" />
                                                                    <time>{h.created_at}</time>
                                                                </div>
                                                            </div>

                                                            {h.comments && (
                                                                <div className="mt-2 p-2 bg-surface-tertiary border border-border rounded">
                                                                    <p className="text-xs text-fg-secondary italic leading-relaxed">&ldquo;{h.comments}&rdquo;</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-tertiary mb-3">
                                                    <Clock size={24} weight="regular" className="text-fg-tertiary" />
                                                </div>
                                                <p className="text-xs text-fg-tertiary">No status history yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* END RIGHT COLUMN */}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}