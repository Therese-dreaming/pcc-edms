import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    IconArrowRight,
    IconCalendar,
    IconCheck,
    IconClock,
    IconFileText,
    IconUser,
} from '@tabler/icons-react';

const STATUS_LABELS = {
    reported: 'Reported',
    under_investigation: 'Under Investigation',
    corrective_action_in_progress: 'Corrective Action in Progress',
    resolved: 'Resolved',
    closed: 'Closed',
};

const SEVERITY_STYLES = {
    low: 'bg-zinc-100 text-zinc-700',
    medium: 'bg-amber-50 text-amber-800 border border-amber-200',
    high: 'bg-orange-50 text-orange-800 border border-orange-200',
    critical: 'bg-red-50 text-red-800 border border-red-200',
};

export default function Show({ incident, legalTransitions }) {
    const { auth } = usePage().props;
    const canManage =
        ['ethics_secretariat', 'ethics_committee_chair'].includes(auth.roleName) ||
        incident.assigned_to === auth.user.id;

    const assignForm = useForm({ assignee_email: '' });
    const noteForm = useForm({ note: '' });
    const correctiveActionForm = useForm({ corrective_action_required: '', corrective_action_due_date: '' });

    return (
        <AuthenticatedLayout>
            <Head title="Incident" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="mb-8 border-b border-border pb-6">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Incidents</p>
                        <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">{`Incident — ${incident.remis_application?.tracking_number}`}</h1>
                        <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">{incident.incident_type}</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Overview Card */}
                            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-zinc-600">Status:</span>
                                            <StatusBadge status={incident.status} label={STATUS_LABELS[incident.status]} />
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${SEVERITY_STYLES[incident.severity] ?? SEVERITY_STYLES.low}`}>
                                            {incident.severity} severity
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <dl className="mb-6 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Type</dt>
                                            <dd className="text-sm font-medium capitalize text-zinc-900">{incident.incident_type?.replace(/_/g, ' ')}</dd>
                                        </div>

                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Reported By</dt>
                                            <dd className="text-sm font-medium text-zinc-900">{incident.reporter?.name ?? 'N/A'}</dd>
                                        </div>

                                        <div>
                                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Assigned To</dt>
                                            <dd className="text-sm font-medium text-zinc-900">{incident.assignee?.name ?? 'Unassigned'}</dd>
                                        </div>
                                    </dl>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Description</h4>
                                            <p className="text-sm text-zinc-800 leading-relaxed">{incident.description}</p>
                                        </div>

                                        {incident.immediate_actions && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Immediate Actions</h4>
                                                <p className="text-sm text-zinc-800 leading-relaxed">{incident.immediate_actions}</p>
                                            </div>
                                        )}

                                        {incident.investigation_notes && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Investigation Notes</h4>
                                                <pre className="whitespace-pre-wrap text-sm text-zinc-800 font-sans leading-relaxed">{incident.investigation_notes}</pre>
                                            </div>
                                        )}

                                        {incident.corrective_action_required && (
                                            <div className="p-4 bg-surface-tertiary border border-border rounded-lg text-sm space-y-1">
                                                <p><span className="font-semibold text-zinc-900">Corrective Action:</span> {incident.corrective_action_required}</p>
                                                <p><span className="font-semibold text-zinc-900">Due:</span> {incident.corrective_action_due_date}</p>
                                                <p><span className="font-semibold text-zinc-900">Status:</span> {incident.corrective_action_status}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Manage Incident Card */}
                            {canManage && (
                                <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                                    <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
                                        <h3 className="text-lg font-semibold text-zinc-900">Manage Incident</h3>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {!incident.assigned_to && (
                                            <form
                                                onSubmit={(e) => { e.preventDefault(); assignForm.post(route('incidents.assign', incident.id)); }}
                                                className="flex items-end gap-2"
                                            >
                                                <div className="flex-1">
                                                    <TextInput
                                                        className="block w-full"
                                                        type="email"
                                                        placeholder="Assignee email"
                                                        value={assignForm.data.assignee_email}
                                                        onChange={(e) => assignForm.setData('assignee_email', e.target.value)}
                                                    />
                                                    <InputError message={assignForm.errors.assignee_email} className="mt-2" />
                                                </div>
                                                <PrimaryButton disabled={assignForm.processing}>Assign</PrimaryButton>
                                            </form>
                                        )}

                                        <form
                                            onSubmit={(e) => { e.preventDefault(); noteForm.post(route('incidents.note', incident.id)); }}
                                            className="flex items-end gap-2"
                                        >
                                            <div className="flex-1">
                                                <TextInput
                                                    className="block w-full"
                                                    placeholder="Add investigation note"
                                                    value={noteForm.data.note}
                                                    onChange={(e) => noteForm.setData('note', e.target.value)}
                                                />
                                            </div>
                                            <PrimaryButton disabled={noteForm.processing}>Add Note</PrimaryButton>
                                        </form>

                                        {legalTransitions.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {legalTransitions.map((status) => (
                                                    <PrimaryButton
                                                        key={status}
                                                        onClick={() => router.post(route('incidents.transition', incident.id), { status })}
                                                    >
                                                        Move to {STATUS_LABELS[status] ?? status}
                                                    </PrimaryButton>
                                                ))}
                                            </div>
                                        )}

                                        {!incident.corrective_action_required && (
                                            <form
                                                onSubmit={(e) => { e.preventDefault(); correctiveActionForm.post(route('incidents.corrective-action', incident.id)); }}
                                                className="p-5 bg-surface-tertiary border border-border rounded-lg space-y-3"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <IconFileText size={18} className="text-primary" strokeWidth={2} />
                                                    <h4 className="text-base font-semibold text-zinc-900">Set Corrective Action</h4>
                                                </div>
                                                <TextInput
                                                    className="block w-full"
                                                    placeholder="Corrective action required"
                                                    value={correctiveActionForm.data.corrective_action_required}
                                                    onChange={(e) => correctiveActionForm.setData('corrective_action_required', e.target.value)}
                                                />
                                                <TextInput
                                                    type="date"
                                                    className="block w-full"
                                                    value={correctiveActionForm.data.corrective_action_due_date}
                                                    onChange={(e) => correctiveActionForm.setData('corrective_action_due_date', e.target.value)}
                                                />
                                                <PrimaryButton disabled={correctiveActionForm.processing}>Set Corrective Action</PrimaryButton>
                                            </form>
                                        )}

                                        {incident.corrective_action_status === 'in_progress' && (
                                            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                <button
                                                    onClick={() => router.post(route('incidents.corrective-action.complete', incident.id))}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-colors"
                                                >
                                                    <IconCheck size={16} strokeWidth={2.5} />
                                                    Mark Corrective Action Completed
                                                </button>
                                            </div>
                                        )}

                                        {incident.corrective_action_status === 'completed' && (
                                            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                <button
                                                    onClick={() => router.post(route('incidents.corrective-action.verify', incident.id))}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-colors"
                                                >
                                                    <IconCheck size={16} strokeWidth={2.5} />
                                                    Verify Corrective Action
                                                </button>
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

                                    <div className="p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                                        {incident.status_history && incident.status_history.length > 0 ? (
                                            <div className="space-y-4">
                                                {incident.status_history.map((h, index) => (
                                                    <div key={h.id} className="relative flex gap-3 group">
                                                        {index !== incident.status_history.length - 1 && (
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
                                                                    <IconCalendar size={12} className="text-zinc-400" />
                                                                    <time>{h.created_at}</time>
                                                                </div>
                                                            </div>
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
