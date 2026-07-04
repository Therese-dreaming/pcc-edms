import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, router, useForm, usePage } from '@inertiajs/react';

const STATUS_LABELS = {
    reported: 'Reported',
    under_investigation: 'Under Investigation',
    corrective_action_in_progress: 'Corrective Action in Progress',
    resolved: 'Resolved',
    closed: 'Closed',
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
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Incident — {incident.remis_application?.tracking_number}</h2>}>
            <Head title="Incident" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <p className="text-sm text-gray-600">
                            Status: <span className="font-semibold">{STATUS_LABELS[incident.status] ?? incident.status}</span>
                        </p>
                        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div><dt className="text-gray-500">Type</dt><dd>{incident.incident_type}</dd></div>
                            <div><dt className="text-gray-500">Severity</dt><dd>{incident.severity}</dd></div>
                            <div><dt className="text-gray-500">Reported By</dt><dd>{incident.reporter?.name}</dd></div>
                            <div><dt className="text-gray-500">Assigned To</dt><dd>{incident.assignee?.name ?? 'Unassigned'}</dd></div>
                            <div className="col-span-2"><dt className="text-gray-500">Description</dt><dd>{incident.description}</dd></div>
                            {incident.immediate_actions && (
                                <div className="col-span-2"><dt className="text-gray-500">Immediate Actions</dt><dd>{incident.immediate_actions}</dd></div>
                            )}
                        </dl>

                        {incident.investigation_notes && (
                            <div className="mt-4">
                                <dt className="text-sm text-gray-500">Investigation Notes</dt>
                                <pre className="mt-1 whitespace-pre-wrap text-sm">{incident.investigation_notes}</pre>
                            </div>
                        )}

                        {incident.corrective_action_required && (
                            <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm">
                                <p><strong>Corrective Action:</strong> {incident.corrective_action_required}</p>
                                <p><strong>Due:</strong> {incident.corrective_action_due_date}</p>
                                <p><strong>Status:</strong> {incident.corrective_action_status}</p>
                            </div>
                        )}
                    </div>

                    {canManage && (
                        <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg space-y-6">
                            <h3 className="text-lg font-semibold">Manage Incident</h3>

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
                                    className="space-y-2"
                                >
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
                                <PrimaryButton onClick={() => router.post(route('incidents.corrective-action.complete', incident.id))}>
                                    Mark Corrective Action Completed
                                </PrimaryButton>
                            )}

                            {incident.corrective_action_status === 'completed' && (
                                <PrimaryButton onClick={() => router.post(route('incidents.corrective-action.verify', incident.id))}>
                                    Verify Corrective Action
                                </PrimaryButton>
                            )}
                        </div>
                    )}

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold">Status History</h3>
                        <ul className="space-y-2 text-sm">
                            {incident.status_history?.map((h) => (
                                <li key={h.id} className="border-b pb-2">
                                    <span className="font-semibold">{h.from_status ?? '(new)'} → {h.to_status}</span>{' '}
                                    by {h.changed_by?.name ?? 'system'} at {h.created_at}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
