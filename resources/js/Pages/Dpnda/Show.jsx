import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import SignaturePad from '@/Components/SignaturePad';
import StatusBadge from '@/Components/StatusBadge';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    IconAlertTriangle,
    IconClock,
    IconDownload,
    IconFileText,
    IconPencil,
    IconSend,
    IconUpload,
    IconUserCheck,
    IconX,
} from '@tabler/icons-react';

const STATUS_LABELS = {
    draft: 'Draft',
    sent_for_signing: 'Sent for Signing',
    trainee_signed: 'Trainee Signed',
    declined: 'Declined',
    coordinator_countersigned: 'Coordinator Countersigned',
    completed: 'Completed',
};

// Shared panel + label primitives so the whole page reads as one system (mirrors
// the DPREQ/REMIS Show pages — see .claude/skills/redesign).
const PANEL = 'overflow-hidden rounded-lg border border-border bg-surface-secondary shadow-sm';
const PANEL_HEAD = 'flex items-center justify-between gap-3 border-b border-border bg-surface-tertiary/50 px-6 py-4';
const PANEL_TITLE = 'font-display text-sm font-semibold text-fg-primary';
const PANEL_EYEBROW = 'text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700';
const MICRO_LABEL = 'text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-fg-tertiary';
const PRIMARY_BTN =
    'inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0';
const SECONDARY_BTN =
    'inline-flex items-center gap-2 rounded-lg border border-border-medium bg-surface-secondary px-4 py-2 text-[0.8125rem] font-semibold text-fg-secondary shadow-sm transition hover:border-border-medium hover:bg-surface-tertiary active:translate-y-px';
const DANGER_BTN =
    'inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 active:translate-y-px disabled:opacity-50';
const TEXT_INPUT =
    'block w-full rounded-full border border-border-medium bg-surface-secondary px-4 py-2.5 text-[0.8125rem] text-fg-primary placeholder:text-fg-tertiary shadow-sm transition focus:border-primary-600 focus:outline-none focus:ring-[3px] focus:ring-primary-600/15';
const TEXTAREA =
    'block w-full rounded-lg border border-border-medium bg-surface-secondary px-3 py-2 text-[0.8125rem] text-fg-primary placeholder:text-fg-tertiary shadow-sm transition focus:border-primary-600 focus:outline-none focus:ring-[3px] focus:ring-primary-600/15';

const titleCase = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') return String(value);
    return value.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null;

// A data table that lays field label/value pairs out as rows.
function DetailTable({ rows }) {
    return (
        <table className="w-full text-left text-[0.8125rem]">
            <tbody className="divide-y divide-border">
                {rows.map((row) => (
                    <tr key={row.label} className="align-top">
                        <th scope="row" className={`w-52 whitespace-nowrap bg-surface-tertiary/40 px-6 py-3 text-left align-top ${MICRO_LABEL}`}>
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

export default function Show({ record, legalTransitions }) {
    const { auth } = usePage().props;
    const placement = record.placement ?? {};
    const isCoordinator = placement.coordinator_id === auth.user.id;
    const isTrainee = placement.trainee_id === auth.user.id;

    const signForm = useForm({ typed_full_name: '', signature_image: null });
    const counterSignForm = useForm({ typed_full_name: '', signature_image: null });
    const declineForm = useForm({ reason: '' });
    const evaluationForm = useForm({ document: null, notes: '' });

    const traineeName = [placement.trainee_first_name, placement.trainee_last_name].filter(Boolean).join(' ');
    const hasPdf = record.documents && record.documents.length > 0;
    const canSend = isCoordinator && legalTransitions.includes('sent_for_signing');

    const address = [
        placement.address_house_no,
        placement.address_street,
        placement.address_barangay,
        placement.address_city,
    ]
        .filter(Boolean)
        .join(', ');

    const placementRows = [
        { label: 'Trainee', value: placement.trainee?.name },
        { label: 'Enrolled School', value: placement.enrolled_school },
        { label: 'Trainee Type', value: titleCase(placement.trainee_type) },
        { label: 'Department Assigned', value: titleCase(placement.department_assigned) },
        { label: 'PCC Supervisor', value: placement.pcc_supervisor },
        { label: 'Endorsed By', value: placement.endorsed_by },
        { label: 'Hours Needed', value: placement.hours_needed },
        { label: 'Level / Course / Section', value: [placement.level, placement.course, placement.section].filter(Boolean).join(' · ') },
        { label: 'Guardian (if minor)', value: placement.guardian_name },
        { label: 'Address', value: address },
        {
            label: 'Duration',
            value:
                placement.start_date && placement.end_date
                    ? `${formatDate(placement.start_date)} — ${formatDate(placement.end_date)}`
                    : null,
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={record.tracking_number} />

            <div className="py-8 font-sans text-fg-primary [font-optical-sizing:auto]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="mb-8 border-b border-border pb-6">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <p className={PANEL_EYEBROW}>DPNDA Record</p>
                                    <span className="text-border-medium">/</span>
                                    <span className="font-display text-xs font-semibold tabular-nums text-fg-tertiary">
                                        {record.tracking_number}
                                    </span>
                                </div>
                                <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">
                                    {traineeName || <span className="text-fg-tertiary">Trainee name not available</span>}
                                </h1>
                                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-tertiary">
                                    <span className="font-medium text-fg-secondary">{placement.trainee?.email || 'No email'}</span>
                                    <span className="text-border-medium">•</span>
                                    <StatusBadge status={record.status} label={STATUS_LABELS[record.status]} />
                                    {placement.start_date && (
                                        <>
                                            <span className="text-border-medium">•</span>
                                            <span>
                                                {formatDate(placement.start_date)} — {formatDate(placement.end_date) || 'Ongoing'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {hasPdf && (
                                    <a href={route('dpnda.pdf', record.id)} className={SECONDARY_BTN}>
                                        <IconDownload size={15} strokeWidth={2} />
                                        Download NDA PDF
                                    </a>
                                )}
                                {canSend && (
                                    <button onClick={() => router.post(route('dpnda.send-for-signing', record.id))} className={PRIMARY_BTN}>
                                        <IconSend size={15} strokeWidth={2} />
                                        Send for Signing
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Two-column body */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* LEFT COLUMN */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Placement Details */}
                            <div className={PANEL}>
                                <div className={PANEL_HEAD}>
                                    <div>
                                        <p className={PANEL_EYEBROW}>Form 5</p>
                                        <h3 className={PANEL_TITLE}>Placement Details</h3>
                                    </div>
                                </div>
                                <DetailTable rows={placementRows} />
                            </div>

                            {/* Workflow Actions */}
                            <div className={PANEL}>
                                <div className={PANEL_HEAD}>
                                    <div>
                                        <p className={PANEL_EYEBROW}>Workflow</p>
                                        <h3 className={PANEL_TITLE}>Actions</h3>
                                    </div>
                                </div>

                                <div className="space-y-4 p-6">
                                    {/* Send for Signing */}
                                    {canSend && (
                                        <div className="rounded-lg border border-primary-200 bg-primary-soft p-4">
                                            <div className="mb-2 flex items-center gap-1.5">
                                                <IconSend size={16} className="text-primary-700" strokeWidth={2} />
                                                <h4 className="text-sm font-semibold text-fg-primary">Send for Signing</h4>
                                            </div>
                                            <p className="mb-3 text-xs text-fg-secondary">
                                                Send this NDA to the trainee for their signature.
                                            </p>
                                            <button onClick={() => router.post(route('dpnda.send-for-signing', record.id))} className={PRIMARY_BTN}>
                                                <IconSend size={14} strokeWidth={2.5} />
                                                Send for Signing
                                            </button>
                                        </div>
                                    )}

                                    {/* Trainee Actions: Sign or Decline */}
                                    {isTrainee && record.status === 'sent_for_signing' && (
                                        <div className="space-y-4">
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    signForm.post(route('dpnda.sign', record.id));
                                                }}
                                                className="space-y-3 rounded-lg border border-primary-200 bg-primary-soft p-4"
                                            >
                                                <div className="mb-1 flex items-center gap-1.5">
                                                    <IconPencil size={16} className="text-primary-700" strokeWidth={2} />
                                                    <h4 className="text-sm font-semibold text-fg-primary">Sign this NDA</h4>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-fg-secondary">Full Name</label>
                                                    <input
                                                        className={TEXT_INPUT}
                                                        placeholder="Type your full name to sign"
                                                        value={signForm.data.typed_full_name}
                                                        onChange={(e) => signForm.setData('typed_full_name', e.target.value)}
                                                    />
                                                    <InputError message={signForm.errors.typed_full_name} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <SignaturePad onChange={(image) => signForm.setData('signature_image', image)} />
                                                </div>
                                                <button type="submit" disabled={signForm.processing} className={PRIMARY_BTN}>
                                                    <IconPencil size={14} strokeWidth={2.5} />
                                                    {signForm.processing ? 'Signing…' : 'Sign NDA'}
                                                </button>
                                            </form>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    declineForm.post(route('dpnda.decline', record.id));
                                                }}
                                                className="space-y-3 rounded-lg border border-danger/30 bg-danger-bg p-4"
                                            >
                                                <div className="mb-1 flex items-center gap-1.5">
                                                    <IconX size={16} className="text-danger" strokeWidth={2} />
                                                    <h4 className="text-sm font-semibold text-fg-primary">Decline NDA</h4>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-fg-secondary">
                                                        Reason <span className="text-danger">*</span>
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        className={TEXTAREA}
                                                        placeholder="Explain why you're declining…"
                                                        value={declineForm.data.reason}
                                                        onChange={(e) => declineForm.setData('reason', e.target.value)}
                                                    />
                                                    <InputError message={declineForm.errors.reason} />
                                                </div>
                                                <button type="submit" disabled={declineForm.processing} className={DANGER_BTN}>
                                                    <IconX size={14} strokeWidth={2.5} />
                                                    {declineForm.processing ? 'Declining…' : 'Decline NDA'}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {/* Coordinator Countersign */}
                                    {isCoordinator && record.status === 'trainee_signed' && (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                counterSignForm.post(route('dpnda.countersign', record.id));
                                            }}
                                            className="space-y-3 rounded-lg border border-primary-200 bg-primary-soft p-4"
                                        >
                                            <div className="mb-1 flex items-center gap-1.5">
                                                <IconPencil size={16} className="text-primary-700" strokeWidth={2} />
                                                <h4 className="text-sm font-semibold text-fg-primary">Countersign NDA</h4>
                                            </div>
                                            <p className="mb-2 text-xs text-fg-secondary">
                                                The trainee has signed. Add your countersignature to complete the NDA.
                                            </p>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-fg-secondary">Full Name</label>
                                                <input
                                                    className={TEXT_INPUT}
                                                    placeholder="Type your full name to countersign"
                                                    value={counterSignForm.data.typed_full_name}
                                                    onChange={(e) => counterSignForm.setData('typed_full_name', e.target.value)}
                                                />
                                                <InputError message={counterSignForm.errors.typed_full_name} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <SignaturePad onChange={(image) => counterSignForm.setData('signature_image', image)} />
                                            </div>
                                            <button type="submit" disabled={counterSignForm.processing} className={PRIMARY_BTN}>
                                                <IconPencil size={14} strokeWidth={2.5} />
                                                {counterSignForm.processing ? 'Countersigning…' : 'Countersign'}
                                            </button>
                                        </form>
                                    )}

                                    {/* No Actions Available */}
                                    {legalTransitions.length === 0 && !canSend && !(isTrainee && record.status === 'sent_for_signing') && (
                                        <div className="rounded-lg bg-surface-tertiary p-4 ring-1 ring-inset ring-border">
                                            <div className="flex items-start gap-2.5">
                                                <IconAlertTriangle size={16} className="mt-0.5 shrink-0 text-fg-tertiary" strokeWidth={2} />
                                                <div>
                                                    <h4 className="text-[0.8125rem] font-semibold text-fg-primary">No Actions Available</h4>
                                                    <p className="mt-1 text-xs text-fg-secondary">
                                                        This record is in a terminal state. No further actions can be taken.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* OJT Evaluation Report */}
                            {record.status === 'completed' && (
                                <div className={PANEL}>
                                    <div className={PANEL_HEAD}>
                                        <div>
                                            <p className={PANEL_EYEBROW}>Deliverable</p>
                                            <h3 className={PANEL_TITLE}>OJT Evaluation Report</h3>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {placement.ojt_evaluation_report ? (
                                            <div className="space-y-2">
                                                <div className="rounded-lg border border-success/30 bg-success-bg p-3">
                                                    <div className="flex items-start gap-2">
                                                        <IconUserCheck size={14} className="mt-0.5 shrink-0 text-success" strokeWidth={2} />
                                                        <div>
                                                            <p className="text-xs font-medium text-fg-success-strong">
                                                                Uploaded by {placement.ojt_evaluation_report.uploader?.name || 'Unknown'}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-fg-success-strong">
                                                                {placement.ojt_evaluation_report.submitted_at
                                                                    ? new Date(placement.ojt_evaluation_report.submitted_at).toLocaleDateString('en-US', {
                                                                          month: 'short',
                                                                          day: 'numeric',
                                                                          year: 'numeric',
                                                                      })
                                                                    : 'Date not available'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {placement.ojt_evaluation_report.notes && (
                                                    <div className="rounded-lg bg-surface-tertiary p-3 ring-1 ring-inset ring-border">
                                                        <p className={`mb-1 ${MICRO_LABEL}`}>Notes</p>
                                                        <p className="text-xs leading-relaxed text-fg-secondary">{placement.ojt_evaluation_report.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : isCoordinator ? (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    evaluationForm.post(route('dpnda.evaluation-report.store', record.id), { forceFormData: true });
                                                }}
                                                className="space-y-3"
                                            >
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-fg-secondary">
                                                        Evaluation Document <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        onChange={(e) => evaluationForm.setData('document', e.target.files[0])}
                                                        className="block w-full cursor-pointer text-xs text-fg-secondary file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-surface-tertiary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-fg-secondary hover:file:bg-surface-tertiary-medium"
                                                    />
                                                    <InputError message={evaluationForm.errors.document} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-fg-secondary">
                                                        Notes <span className="text-fg-tertiary">(optional)</span>
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        className={TEXTAREA}
                                                        placeholder="Add any additional notes about this evaluation…"
                                                        value={evaluationForm.data.notes}
                                                        onChange={(e) => evaluationForm.setData('notes', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={evaluationForm.errors.evaluation_report} />
                                                <button type="submit" disabled={evaluationForm.processing} className={PRIMARY_BTN}>
                                                    <IconUpload size={14} strokeWidth={2.5} />
                                                    {evaluationForm.processing ? 'Uploading…' : 'Upload Evaluation Report'}
                                                </button>
                                            </form>
                                        ) : (
                                            <div className="rounded-lg bg-surface-tertiary py-6 text-center ring-1 ring-inset ring-border">
                                                <IconFileText size={20} className="mx-auto mb-2 text-fg-tertiary" />
                                                <p className="text-xs text-fg-tertiary">Evaluation report not yet uploaded.</p>
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
                                                <StatusBadge status={record.status} label={STATUS_LABELS[record.status]} />
                                            </dd>
                                        </div>
                                        <div className="py-4">
                                            <dt className={`mb-1.5 ${MICRO_LABEL}`}>Coordinator</dt>
                                            <dd className="text-[0.8125rem] font-medium text-fg-primary">
                                                {placement.coordinator?.name || <span className="font-normal italic text-fg-tertiary">Not assigned</span>}
                                            </dd>
                                        </div>
                                        <div className="pt-4">
                                            <dt className={`mb-1.5 ${MICRO_LABEL}`}>Created</dt>
                                            <dd className="text-[0.8125rem] font-medium tabular-nums text-fg-primary">
                                                {formatDate(record.created_at) || '—'}
                                            </dd>
                                        </div>
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
                                            {record.status_history?.length ?? 0}
                                        </span>
                                    </div>

                                    <div className="p-6">
                                        {record.status_history && record.status_history.length > 0 ? (
                                            <div className="space-y-1">
                                                {record.status_history.map((h, index) => (
                                                    <div key={h.id} className="group relative flex gap-3">
                                                        {index !== record.status_history.length - 1 && (
                                                            <div className="absolute left-[5px] top-4 h-[calc(100%-4px)] w-px bg-border" />
                                                        )}
                                                        <div className="relative flex-shrink-0 pt-1.5">
                                                            <div className="size-2.5 rounded-full bg-primary-600 ring-4 ring-primary-100" />
                                                        </div>
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
                                                            <p className="text-xs font-medium text-fg-secondary">{h.changed_by?.name ?? 'System'}</p>
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
                                                                    <p className="text-xs italic leading-relaxed text-fg-secondary">&ldquo;{h.comments}&rdquo;</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center">
                                                <IconClock size={24} className="mx-auto mb-3 text-fg-tertiary" />
                                                <p className="text-xs text-fg-tertiary">No status history yet.</p>
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
