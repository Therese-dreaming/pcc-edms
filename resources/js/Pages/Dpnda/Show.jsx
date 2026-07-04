import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import SignaturePad from '@/Components/SignaturePad';
import { Head, router, useForm, usePage } from '@inertiajs/react';

const STATUS_LABELS = {
    draft: 'Draft',
    sent_for_signing: 'Sent for Signing',
    trainee_signed: 'Trainee Signed',
    declined: 'Declined',
    coordinator_countersigned: 'Coordinator Countersigned',
    completed: 'Completed',
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
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{record.tracking_number}</h2>}>
            <Head title={record.tracking_number} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="text-lg font-semibold">
                            {record.placement?.trainee_first_name} {record.placement?.trainee_last_name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Status: <span className="font-semibold">{STATUS_LABELS[record.status] ?? record.status}</span>
                        </p>
                        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div><dt className="text-gray-500">Enrolled School</dt><dd>{record.placement?.enrolled_school}</dd></div>
                            <div><dt className="text-gray-500">Department Assigned</dt><dd>{record.placement?.department_assigned}</dd></div>
                            <div><dt className="text-gray-500">Coordinator</dt><dd>{record.placement?.coordinator?.name}</dd></div>
                            <div><dt className="text-gray-500">Trainee</dt><dd>{record.placement?.trainee?.name}</dd></div>
                            <div><dt className="text-gray-500">Duration</dt><dd>{record.placement?.start_date} to {record.placement?.end_date}</dd></div>
                        </dl>

                        {record.documents && record.documents.length > 0 && (
                            <a
                                href={route('dpnda.pdf', record.id)}
                                className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
                            >
                                Download signed NDA PDF
                            </a>
                        )}
                    </div>

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold">Actions</h3>

                        {isCoordinator && legalTransitions.includes('sent_for_signing') && (
                            <PrimaryButton onClick={() => router.post(route('dpnda.send-for-signing', record.id))}>
                                Send for Signing
                            </PrimaryButton>
                        )}

                        {isTrainee && record.status === 'sent_for_signing' && (
                            <div className="space-y-4">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); signForm.post(route('dpnda.sign', record.id)); }}
                                    className="space-y-2"
                                >
                                    <input
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="Type your full name to sign"
                                        value={signForm.data.typed_full_name}
                                        onChange={(e) => signForm.setData('typed_full_name', e.target.value)}
                                    />
                                    <InputError message={signForm.errors.typed_full_name} className="mt-2" />
                                    <SignaturePad onChange={(image) => signForm.setData('signature_image', image)} />
                                    <PrimaryButton disabled={signForm.processing}>Sign</PrimaryButton>
                                </form>
                                <form
                                    onSubmit={(e) => { e.preventDefault(); declineForm.post(route('dpnda.decline', record.id)); }}
                                    className="space-y-2"
                                >
                                    <textarea
                                        className="block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="Reason for declining (required)"
                                        value={declineForm.data.reason}
                                        onChange={(e) => declineForm.setData('reason', e.target.value)}
                                    />
                                    <InputError message={declineForm.errors.reason} />
                                    <DangerButton disabled={declineForm.processing}>Decline</DangerButton>
                                </form>
                            </div>
                        )}

                        {isCoordinator && record.status === 'trainee_signed' && (
                            <form
                                onSubmit={(e) => { e.preventDefault(); counterSignForm.post(route('dpnda.countersign', record.id)); }}
                                className="space-y-2"
                            >
                                <input
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="Type your full name to countersign"
                                    value={counterSignForm.data.typed_full_name}
                                    onChange={(e) => counterSignForm.setData('typed_full_name', e.target.value)}
                                />
                                <InputError message={counterSignForm.errors.typed_full_name} className="mt-2" />
                                <SignaturePad onChange={(image) => counterSignForm.setData('signature_image', image)} />
                                <PrimaryButton disabled={counterSignForm.processing}>Countersign</PrimaryButton>
                            </form>
                        )}

                        {legalTransitions.length === 0 && (
                            <p className="text-sm text-gray-500">No further actions — this record is in a terminal state.</p>
                        )}
                    </div>

                    {record.status === 'completed' && (
                        <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                            <h3 className="mb-4 text-lg font-semibold">OJT Evaluation Report</h3>

                            {record.placement?.ojt_evaluation_report ? (
                                <div className="text-sm text-gray-700">
                                    <p>
                                        Uploaded by {record.placement.ojt_evaluation_report.uploader?.name} on{' '}
                                        {record.placement.ojt_evaluation_report.submitted_at}
                                    </p>
                                    {record.placement.ojt_evaluation_report.notes && (
                                        <p className="mt-1 text-gray-600">{record.placement.ojt_evaluation_report.notes}</p>
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
                                    className="space-y-2"
                                >
                                    <input
                                        type="file"
                                        onChange={(e) => evaluationForm.setData('document', e.target.files[0])}
                                    />
                                    <textarea
                                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                        placeholder="Notes (optional)"
                                        value={evaluationForm.data.notes}
                                        onChange={(e) => evaluationForm.setData('notes', e.target.value)}
                                    />
                                    <InputError message={evaluationForm.errors.evaluation_report} />
                                    <InputError message={evaluationForm.errors.document} />
                                    <PrimaryButton disabled={evaluationForm.processing}>Upload Evaluation Report</PrimaryButton>
                                </form>
                            ) : (
                                <p className="text-sm text-gray-500">Not yet uploaded.</p>
                            )}
                        </div>
                    )}

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold">Status History</h3>
                        <ul className="space-y-2 text-sm">
                            {record.status_history?.map((h) => (
                                <li key={h.id} className="border-b pb-2">
                                    <span className="font-semibold">{h.from_status ?? '(new)'} → {h.to_status}</span>{' '}
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
