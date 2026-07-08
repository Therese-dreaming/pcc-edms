import InputError from '@/Components/InputError';
import PageHeader from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import SignaturePad from '@/Components/SignaturePad';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
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
    deferred: 'Deferred',
    disapproved: 'Disapproved',
    clearance_issued: 'Clearance Issued',
    monitoring: 'Monitoring',
    closed: 'Closed',
    archived: 'Archived',
};

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
    'block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors text-xs';

// Every workflow action panel shares one flat, neutral treatment. Distinguishing
// an endorsement from a screening from a decision is done with the icon + heading,
// not with a different accent color per action — a single maroon accent stays the
// one thing that reads as "brand/primary action" on the page.
const panelClass = 'p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3';

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
            popup: 'rounded-lg border border-zinc-200 shadow-sm',
            confirmButton:
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--color-danger,#B23A2E)] hover:brightness-90 text-white text-xs font-semibold mr-2',
            cancelButton:
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold',
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
        <div className="flex flex-col items-center gap-2 text-center py-10 px-5 bg-zinc-50 border border-zinc-200 rounded-lg">
            <Icon size={28} weight="regular" className="text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-800">{title}</p>
            <p className="text-xs text-zinc-500 max-w-sm">{description}</p>
        </div>
    );
}

export default function Show({ application, legalTransitions }) {
    const { auth } = usePage().props;
    const roleName = auth.roleName;
    const isApplicant = application.applicant_id === auth.user.id;
    const reviewAssignments = application.review_assignments ?? [];
    const myAssignment = reviewAssignments.find((ra) => ra.reviewer_id === auth.user.id);
    const isAssignedReviewer = !!myAssignment;
    const allReviewersSubmitted = reviewAssignments.length > 0 && reviewAssignments.every((ra) => ra.submitted_at);

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

    const hasAnyWorkflowAction = canEndorse || canResubmit || canScreen || canAssignReviewer || canReview || canDecide;

    const endorseForm = useForm({ action: 'approve', remarks: '', signature: '', signature_image: null });
    const screenForm = useForm({ decision: 'complete', comments: '' });
    const assignForm = useForm({ reviewer_email: '' });
    const reviewForm = useForm({ risk_level: 'minimal', rationale: '', recommendation: 'approve', comments: '' });
    const decideForm = useForm({ outcome: 'approved', conditions: '', remarks: '', signature: '', signature_image: null });

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
                    <div className="mb-6 border-b border-zinc-200 pb-5">
                        <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-zinc-500">
                            <Flask size={14} className="text-primary-700" weight="regular" />
                            {application.tracking_number}
                        </div>
                        <h1 className="mb-2 font-display text-xl font-semibold leading-tight text-zinc-900">
                            {application.research_application?.research_title || (
                                <span className="text-zinc-400">Untitled Research</span>
                            )}
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <div className="flex items-center gap-1.5">
                                <User size={14} weight="regular" className="text-zinc-400" />
                                {application.research_application?.applicant?.name || 'Unknown'}
                            </div>
                            <span className="text-zinc-300">•</span>
                            <StatusBadge status={application.status} label={STATUS_LABELS[application.status]} />
                            {application.current_endorsement_step && (
                                <>
                                    <span className="text-zinc-300">•</span>
                                    <span>Awaiting {application.current_endorsement_step.replace('_', ' ')}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Research Details Card */}
                            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-zinc-900">Research Details</h3>
                                </div>

                                <div className="p-5">
                                    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Applicant</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {application.research_application?.applicant?.name || (
                                                    <span className="font-normal italic text-zinc-400">Not specified</span>
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Study Type</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {formatStudyType(application.study_type) || (
                                                    <span className="font-normal italic text-zinc-400">Not specified</span>
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Study Design</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {formatFieldValue(application.study_design) || (
                                                    <span className="font-normal italic text-zinc-400">Not specified</span>
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Vulnerable Population</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {application.vulnerable_population ? 'Yes' : 'No'}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Target Population</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {application.target_population || (
                                                    <span className="font-normal italic text-zinc-400">Not specified</span>
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Participant Count</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {application.participant_count || (
                                                    <span className="font-normal italic text-zinc-400">Not specified</span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>

                                    <div className="mt-5 pt-5 border-t border-zinc-200 flex flex-wrap gap-2">
                                        {application.status === 'clearance_issued' && (
                                            <a
                                                href={route('remis.clearance-pdf', application.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition-colors"
                                            >
                                                <DownloadSimple size={14} weight="regular" />
                                                Download Certificate
                                            </a>
                                        )}

                                        <a
                                            href={route('incidents.create', application.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600/10 border border-red-600/20 hover:bg-red-600/20 text-red-700 text-xs font-medium transition-colors"
                                        >
                                            <Warning size={14} weight="regular" />
                                            Report Incident
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Endorsement Chain Card */}
                            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-zinc-900">Endorsement Chain</h3>
                                </div>
                                <div className="p-5">
                                    {(!application.endorsement_actions || application.endorsement_actions.length === 0) ? (
                                        <div className="text-center py-6 bg-zinc-50 rounded-lg border border-zinc-200">
                                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 mb-2">
                                                <ClipboardText size={20} weight="regular" className="text-zinc-400" />
                                            </div>
                                            <p className="text-xs text-zinc-500">No endorsement actions yet.</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {application.endorsement_actions.map((e) => (
                                                <li key={e.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-zinc-900 capitalize">
                                                                {e.step.replace('_', ' ')}
                                                            </p>
                                                            <p className="text-xs text-zinc-700 mt-0.5">
                                                                <span className="font-medium">{e.action}</span> by {e.endorser?.name || 'Unknown'}
                                                            </p>
                                                            {e.remarks && (
                                                                <p className="text-xs text-zinc-600 mt-1 italic">&ldquo;{e.remarks}&rdquo;</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Review Panel Card */}
                            {reviewAssignments.length > 0 && (
                                <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                    <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                                                <Users size={16} weight="regular" className="text-primary-700" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-zinc-900">Review Panel</h3>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <ul className="space-y-2">
                                            {reviewAssignments.map((ra) => (
                                                <li key={ra.id} className="rounded-lg border border-zinc-200 p-3">
                                                    <p className="text-sm font-semibold text-zinc-900">{ra.reviewer?.name || 'Unknown Reviewer'}</p>
                                                    {ra.submitted_at ? (
                                                        <>
                                                            <p className="mt-1 text-xs text-zinc-700">
                                                                <span className="font-medium">Recommendation:</span>{' '}
                                                                <span className="capitalize">{ra.recommendation?.replace('_', ' ')}</span>
                                                            </p>
                                                            {ra.comments && (
                                                                <p className="mt-1 text-xs text-zinc-600 italic">&ldquo;{ra.comments}&rdquo;</p>
                                                            )}
                                                            <p className="mt-1 text-xs text-zinc-500">
                                                                Submitted {new Date(ra.submitted_at).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="mt-1 text-xs text-zinc-500 italic">Recommendation pending</p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Monitoring & Completion Card */}
                            {['monitoring', 'closed', 'archived'].includes(application.status) && (
                                <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                    <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
                                        <h3 className="text-lg font-semibold text-zinc-900">Monitoring &amp; Completion</h3>
                                    </div>
                                    <div className="p-6">
                                        {application.completion_report && (
                                            <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm">
                                                <p className="font-semibold text-zinc-900">
                                                    Final Ethics Completion Report — {application.completion_report.final_outcome}
                                                </p>
                                                <p className="text-zinc-700">Completion Date: {application.completion_report.completion_date}</p>
                                                <p className="text-zinc-700">Final Participant Count: {application.completion_report.final_participant_count}</p>
                                                <p className="text-zinc-700">Publication Status: {application.completion_report.publication_status}</p>
                                                <p className="text-zinc-700">Data Storage Location: {application.completion_report.data_storage_location}</p>
                                                <p className="mt-1 text-zinc-600">{application.completion_report.compliance_statement}</p>
                                                {application.completion_report.archived_at && (
                                                    <p className="mt-2 text-xs text-zinc-500">
                                                        Archived at {application.completion_report.archived_at}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <h4 className="mb-3 text-sm font-semibold text-zinc-700 uppercase tracking-wider">Progress Reports</h4>
                                        <ul className="mb-6 space-y-3">
                                            {(application.progress_reports ?? []).length === 0 && (
                                                <li className="text-sm text-zinc-500">No progress reports submitted yet.</li>
                                            )}
                                            {(application.progress_reports ?? []).map((r) => (
                                                <li key={r.id} className="rounded-lg border border-zinc-200 p-4 text-sm">
                                                    <p><span className="font-semibold text-zinc-900">Status of Study:</span> {r.status_of_study}</p>
                                                    <p><span className="font-semibold text-zinc-900">Participants Recruited:</span> {r.participants_recruited}</p>
                                                    {r.ethics_concerns && <p><span className="font-semibold text-zinc-900">Ethics Concerns:</span> {r.ethics_concerns}</p>}
                                                    {r.protocol_deviations && <p><span className="font-semibold text-zinc-900">Protocol Deviations:</span> {r.protocol_deviations}</p>}
                                                    {r.corrective_actions && <p><span className="font-semibold text-zinc-900">Corrective Actions:</span> {r.corrective_actions}</p>}
                                                    <p className="mt-1 text-xs text-zinc-500">
                                                        Submitted by {r.submitter?.name} at {r.submitted_at}
                                                    </p>

                                                    {r.compliance_status ? (
                                                        <p className="mt-2 text-sm text-zinc-700">
                                                            <span className="font-semibold">Compliance:</span>{' '}
                                                            {COMPLIANCE_LABELS[r.compliance_status] ?? r.compliance_status}
                                                            {r.review_notes && ` — "${r.review_notes}"`}
                                                            <span className="ml-1 text-xs text-zinc-500">
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
                                                            className="mt-3 space-y-2 border-t border-zinc-200 pt-3"
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
                                            <div className="space-y-6 border-t border-zinc-200 pt-6">
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        progressForm.post(route('remis.progress-reports.store', application.id), {
                                                            forceFormData: true,
                                                            onSuccess: () => progressForm.reset(),
                                                        });
                                                    }}
                                                    className="p-5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3"
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <PaperPlaneTilt size={18} weight="regular" className="text-primary-700" />
                                                        <h4 className="text-base font-semibold text-zinc-900">Submit Progress Report</h4>
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
                                                        className="block w-full text-sm text-zinc-600"
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
                                                        <h4 className="text-base font-semibold text-zinc-900">
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
                                                        className="block w-full text-sm text-zinc-600"
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
                            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-zinc-900">Workflow Actions</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    {canEndorse && (
                                        <form
                                            onSubmit={(e) => { e.preventDefault(); endorseForm.post(route('remis.endorse', application.id)); }}
                                            className={panelClass}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <PaperPlaneTilt size={16} weight="regular" className="text-primary-700" />
                                                <h4 className="text-sm font-semibold text-zinc-900">Submit Endorsement</h4>
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
                                                <h4 className="text-sm font-semibold text-zinc-900">Ready to Resubmit?</h4>
                                            </div>
                                            <p className="text-xs text-zinc-600">
                                                Once you've addressed the feedback, resubmit your application for review.
                                            </p>
                                            <button
                                                onClick={() => router.post(route('remis.resubmit', application.id))}
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
                                                <h4 className="text-sm font-semibold text-zinc-900">Submit Screening</h4>
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
                                                <h4 className="text-base font-semibold text-zinc-900">
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
                                                <h4 className="text-base font-semibold text-zinc-900">Risk Classification &amp; Review</h4>
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
                                            onSubmit={(e) => { e.preventDefault(); decideForm.post(route('remis.decide', application.id)); }}
                                            className={panelClass}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Warning size={18} weight="regular" className="text-primary-700" />
                                                <h4 className="text-base font-semibold text-zinc-900">Issue Decision</h4>
                                            </div>
                                            <select
                                                className={fieldClass}
                                                value={decideForm.data.outcome}
                                                onChange={(e) => decideForm.setData('outcome', e.target.value)}
                                            >
                                                <option value="approved">Approved</option>
                                                <option value="approved_with_conditions">Approved with Conditions</option>
                                                <option value="deferred">Deferred</option>
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

                        {/* RIGHT COLUMN - Status History */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6">
                                <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                    <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-4">
                                        <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                                            <Clock size={18} weight="regular" className="text-zinc-600" />
                                            Status History
                                        </h3>
                                    </div>

                                    <div className="p-5">
                                        {application.status_history && application.status_history.length > 0 ? (
                                            <div className="space-y-4">
                                                {application.status_history.map((h, index) => (
                                                    <div key={h.id} className="relative flex gap-3 group">
                                                        {index !== application.status_history.length - 1 && (
                                                            <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-zinc-200 group-hover:bg-primary-200 transition-colors"></div>
                                                        )}

                                                        <div className="relative flex-shrink-0">
                                                            <div className="w-8 h-8 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center group-hover:bg-primary-200 group-hover:border-primary-300 transition-colors">
                                                                <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 pt-0 pb-4">
                                                            <div className="space-y-1.5 mb-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700">
                                                                        {h.from_status ?? 'new'}
                                                                    </span>
                                                                    <ArrowRight size={12} weight="regular" className="text-zinc-400" />
                                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-primary-100 text-primary-900">
                                                                        {h.to_status}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="text-xs text-zinc-600 space-y-0.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <User size={12} weight="regular" className="text-zinc-400" />
                                                                    <span className="font-medium text-zinc-700">{h.changed_by?.name ?? 'System'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-zinc-500">
                                                                    <Clock size={12} weight="regular" className="text-zinc-400" />
                                                                    <time>{h.created_at}</time>
                                                                </div>
                                                            </div>

                                                            {h.comments && (
                                                                <div className="mt-2 p-2 bg-zinc-50 border border-zinc-200 rounded">
                                                                    <p className="text-xs text-zinc-700 italic leading-relaxed">&ldquo;{h.comments}&rdquo;</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 mb-3">
                                                    <Clock size={24} weight="regular" className="text-zinc-400" />
                                                </div>
                                                <p className="text-xs text-zinc-500">No status history yet.</p>
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