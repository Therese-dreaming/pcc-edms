import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PageHeader from '@/Components/PageHeader';
import SignaturePad from '@/Components/SignaturePad';
import StatusBadge from '@/Components/StatusBadge';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    IconAlertTriangle,
    IconArrowRight,
    IconClock,
    IconDownload,
    IconFileText,
    IconPencil,
    IconSend,
    IconSignature,
    IconUpload,
    IconUser,
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

// Helper function to format field values
const formatFieldValue = (value) => {
    if (!value) return null;
    if (typeof value !== 'string') return value;
    return value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function Show({ record, legalTransitions }) {
    const { auth } = usePage().props;
    const isCoordinator = record.placement?.coordinator_id === auth.user.id;
    const isTrainee = record.placement?.trainee_id === auth.user.id;

    const signForm = useForm({ typed_full_name: '', signature_image: null });
    const counterSignForm = useForm({ typed_full_name: '', signature_image: null });
    const declineForm = useForm({ reason: '' });
    const evaluationForm = useForm({ document: null, notes: '' });

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconSignature}
                    title={record.tracking_number}
                    description={`${record.placement?.trainee_first_name ?? ''} ${record.placement?.trainee_last_name ?? ''}`.trim()}
                />
            }
        >
            <Head title={record.tracking_number} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    {/* Slim top bar — Stripe-style: identity + status inline, actions right-aligned */}
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-5">
                        <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-zinc-500">
                                <IconSignature size={14} className="text-primary-700" strokeWidth={2} />
                                {record.tracking_number}
                            </div>
                            <h1 className="mb-2 font-display text-xl font-semibold leading-tight text-zinc-900">
                                {record.placement?.trainee_first_name && record.placement?.trainee_last_name
                                    ? `${record.placement.trainee_first_name} ${record.placement.trainee_last_name}`
                                    : 'Trainee Name Not Available'}
                            </h1>
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                    <IconUser size={14} strokeWidth={2} className="text-zinc-400" />
                                    {record.placement?.trainee?.name || 'Unknown'}
                                </div>
                                <span className="text-zinc-300">•</span>
                                <StatusBadge status={record.status} label={STATUS_LABELS[record.status]} />
                            </div>
                        </div>

                        {isCoordinator && legalTransitions.includes('sent_for_signing') && (
                            <button
                                onClick={() => router.post(route('dpnda.send-for-signing', record.id))}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold transition-colors shadow-sm"
                            >
                                <IconSend size={14} strokeWidth={2.5} />
                                Send for Signing
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Placement Details Card */}
                            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-zinc-900">Placement Details</h3>
                                </div>

                                <div className="p-5">
                                    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Enrolled School</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {record.placement?.enrolled_school || (
                                                    <span className="font-normal italic text-zinc-400">Not specified</span>
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Department Assigned</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {formatFieldValue(record.placement?.department_assigned) || (
                                                    <span className="font-normal italic text-zinc-400">Not specified</span>
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Coordinator</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {record.placement?.coordinator?.name || (
                                                    <span className="font-normal italic text-zinc-400">Not assigned</span>
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Trainee</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {record.placement?.trainee?.name || (
                                                    <span className="font-normal italic text-zinc-400">Not assigned</span>
                                                )}
                                            </dd>
                                        </div>

                                        <div className="md:col-span-2">
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Duration</dt>
                                            <dd className="text-sm font-medium text-zinc-900">
                                                {record.placement?.start_date && record.placement?.end_date ? (
                                                    `${record.placement.start_date} to ${record.placement.end_date}`
                                                ) : (
                                                    <span className="font-normal italic text-zinc-400">Not specified</span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>

                                    {record.documents && record.documents.length > 0 && (
                                        <div className="mt-5 pt-5 border-t border-zinc-200">
                                            <a
                                                href={route('dpnda.pdf', record.id)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-zinc-700 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition-colors"
                                            >
                                                <IconDownload size={14} strokeWidth={2} />
                                                Download signed NDA PDF
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Card */}
                            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-zinc-900">Workflow Actions</h3>
                                </div>

                                <div className="p-5 space-y-4">
                                    {/* Send for Signing */}
                                    {isCoordinator && legalTransitions.includes('sent_for_signing') && (
                                        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <IconSend size={16} className="text-primary-700" strokeWidth={2} />
                                                <h4 className="text-sm font-semibold text-zinc-900">Send for Signing</h4>
                                            </div>
                                            <p className="text-xs text-zinc-600 mb-3">
                                                Send this NDA to the trainee for their signature.
                                            </p>
                                            <button
                                                onClick={() => router.post(route('dpnda.send-for-signing', record.id))}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold shadow-sm transition-colors"
                                            >
                                                <IconSend size={14} strokeWidth={2.5} />
                                                Send for Signing
                                            </button>
                                        </div>
                                    )}

                                    {/* Trainee Actions: Sign or Decline */}
                                    {isTrainee && record.status === 'sent_for_signing' && (
                                        <div className="space-y-4">
                                            {/* Sign Form */}
                                            <form
                                                onSubmit={(e) => { e.preventDefault(); signForm.post(route('dpnda.sign', record.id)); }}
                                                className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3"
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <IconPencil size={16} className="text-emerald-700" strokeWidth={2} />
                                                    <h4 className="text-sm font-semibold text-zinc-900">Sign this NDA</h4>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-zinc-700">Full Name</label>
                                                    <input
                                                        className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors text-xs"
                                                        placeholder="Type your full name to sign"
                                                        value={signForm.data.typed_full_name}
                                                        onChange={(e) => signForm.setData('typed_full_name', e.target.value)}
                                                    />
                                                    <InputError message={signForm.errors.typed_full_name} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-zinc-700">Signature</label>
                                                    <SignaturePad onChange={(image) => signForm.setData('signature_image', image)} />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={signForm.processing}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <IconPencil size={14} strokeWidth={2.5} />
                                                    {signForm.processing ? 'Signing...' : 'Sign NDA'}
                                                </button>
                                            </form>

                                            {/* Decline Form */}
                                            <form
                                                onSubmit={(e) => { e.preventDefault(); declineForm.post(route('dpnda.decline', record.id)); }}
                                                className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3"
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <IconX size={16} className="text-red-700" strokeWidth={2} />
                                                    <h4 className="text-sm font-semibold text-zinc-900">Decline NDA</h4>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-zinc-700">
                                                        Reason <span className="text-red-600">*</span>
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors text-xs"
                                                        placeholder="Explain why you're declining..."
                                                        value={declineForm.data.reason}
                                                        onChange={(e) => declineForm.setData('reason', e.target.value)}
                                                    />
                                                    <InputError message={declineForm.errors.reason} />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={declineForm.processing}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <IconX size={14} strokeWidth={2.5} />
                                                    {declineForm.processing ? 'Declining...' : 'Decline NDA'}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {/* Coordinator Countersign */}
                                    {isCoordinator && record.status === 'trainee_signed' && (
                                        <form
                                            onSubmit={(e) => { e.preventDefault(); counterSignForm.post(route('dpnda.countersign', record.id)); }}
                                            className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3"
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <IconPencil size={16} className="text-emerald-700" strokeWidth={2} />
                                                <h4 className="text-sm font-semibold text-zinc-900">Countersign NDA</h4>
                                            </div>
                                            <p className="text-xs text-zinc-600 mb-2">
                                                The trainee has signed. Add your countersignature to complete the NDA.
                                            </p>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-zinc-700">Full Name</label>
                                                <input
                                                    className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors text-xs"
                                                    placeholder="Type your full name to countersign"
                                                    value={counterSignForm.data.typed_full_name}
                                                    onChange={(e) => counterSignForm.setData('typed_full_name', e.target.value)}
                                                />
                                                <InputError message={counterSignForm.errors.typed_full_name} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-zinc-700">Signature</label>
                                                <SignaturePad onChange={(image) => counterSignForm.setData('signature_image', image)} />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={counterSignForm.processing}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <IconPencil size={14} strokeWidth={2.5} />
                                                {counterSignForm.processing ? 'Countersigning...' : 'Countersign'}
                                            </button>
                                        </form>
                                    )}

                                    {/* No Actions Available */}
                                    {legalTransitions.length === 0 && !isCoordinator && !isTrainee && (
                                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                                            <div className="flex items-start gap-2.5">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
                                                    <IconAlertTriangle size={16} className="text-zinc-500" strokeWidth={2} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-zinc-900 mb-0.5">No Actions Available</h4>
                                                    <p className="text-xs text-zinc-600">
                                                        This record is in a terminal state. No further actions can be taken.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* OJT Evaluation Report Card */}
                            {record.status === 'completed' && (
                                <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                    <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                                                <IconFileText size={16} className="text-primary-700" strokeWidth={2} />
                                            </div>
                                            <h3 className="text-sm font-semibold text-zinc-900">OJT Evaluation Report</h3>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        {record.placement?.ojt_evaluation_report ? (
                                            <div className="space-y-2">
                                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                                                    <div className="flex items-start gap-2">
                                                        <IconUserCheck size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                                                        <div>
                                                            <p className="text-xs font-medium text-emerald-900">
                                                                Uploaded by {record.placement.ojt_evaluation_report.uploader?.name || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-emerald-700 mt-0.5">
                                                                {record.placement.ojt_evaluation_report.submitted_at 
                                                                    ? new Date(record.placement.ojt_evaluation_report.submitted_at).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                        hour: 'numeric',
                                                                        minute: '2-digit'
                                                                    })
                                                                    : 'Date not available'
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {record.placement.ojt_evaluation_report.notes && (
                                                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md">
                                                        <p className="text-xs font-medium text-zinc-700 mb-1">Notes:</p>
                                                        <p className="text-xs text-zinc-600 leading-relaxed">
                                                            {record.placement.ojt_evaluation_report.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : isCoordinator ? (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    evaluationForm.post(route('dpnda.evaluation-report.store', record.id), {
                                                        forceFormData: true,
                                                    });
                                                }}
                                                className="space-y-3"
                                            >
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-zinc-700">
                                                        Evaluation Document <span className="text-red-600">*</span>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        onChange={(e) => evaluationForm.setData('document', e.target.files[0])}
                                                        className="block w-full text-xs text-zinc-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 file:cursor-pointer cursor-pointer"
                                                    />
                                                    <InputError message={evaluationForm.errors.document} />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-medium text-zinc-700">
                                                        Notes <span className="text-zinc-400">(optional)</span>
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        className="block w-full rounded-md border-zinc-300 text-xs shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
                                                        placeholder="Add any additional notes about this evaluation..."
                                                        value={evaluationForm.data.notes}
                                                        onChange={(e) => evaluationForm.setData('notes', e.target.value)}
                                                    />
                                                </div>

                                                <InputError message={evaluationForm.errors.evaluation_report} />

                                                <button
                                                    type="submit"
                                                    disabled={evaluationForm.processing}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <IconUpload size={14} strokeWidth={2.5} />
                                                    {evaluationForm.processing ? 'Uploading...' : 'Upload Evaluation Report'}
                                                </button>
                                            </form>
                                        ) : (
                                            <div className="text-center py-6 bg-zinc-50 rounded-lg border border-zinc-200">
                                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 mb-2">
                                                    <IconFileText size={20} className="text-zinc-400" />
                                                </div>
                                                <p className="text-xs text-zinc-500">Evaluation report not yet uploaded.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* END LEFT COLUMN */}

                        {/* RIGHT COLUMN - Status History */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6">
                                <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                    <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-4">
                                        <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                                            <IconClock size={18} className="text-zinc-600" strokeWidth={2} />
                                            Status History
                                        </h3>
                                    </div>

                                    <div className="p-5">
                                        {record.status_history && record.status_history.length > 0 ? (
                                            <div className="space-y-4">
                                                {record.status_history.map((h, index) => (
                                                    <div key={h.id} className="relative flex gap-3 group">
                                                        {index !== record.status_history.length - 1 && (
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
                                                                    <IconArrowRight size={12} className="text-zinc-400" strokeWidth={2} />
                                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-primary-100 text-primary-900">
                                                                        {h.to_status}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="text-xs text-zinc-600 space-y-0.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <IconUser size={12} className="text-zinc-400" />
                                                                    <span className="font-medium text-zinc-700">{h.changed_by?.name ?? 'System'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-zinc-500">
                                                                    <IconClock size={12} className="text-zinc-400" />
                                                                    <time>
                                                                        {h.created_at ? new Date(h.created_at).toLocaleString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric',
                                                                            hour: 'numeric',
                                                                            minute: '2-digit',
                                                                        }) : 'N/A'}
                                                                    </time>
                                                                </div>
                                                            </div>

                                                            {h.comments && (
                                                                <div className="mt-2 p-2 bg-zinc-50 border border-zinc-200 rounded">
                                                                    <p className="text-xs text-zinc-700 italic leading-relaxed">"{h.comments}"</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 mb-3">
                                                    <IconClock size={24} className="text-zinc-400" />
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
