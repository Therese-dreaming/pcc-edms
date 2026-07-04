import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SignaturePad from '@/Components/SignaturePad';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

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

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{application.tracking_number}</h2>}>
            <Head title={application.tracking_number} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="text-lg font-semibold">{application.research_application?.research_title}</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Status: <span className="font-semibold">{STATUS_LABELS[application.status] ?? application.status}</span>
                            {application.current_endorsement_step && ` (awaiting ${application.current_endorsement_step.replace('_', ' ')})`}
                        </p>
                        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div><dt className="text-gray-500">Applicant</dt><dd>{application.research_application?.applicant?.name}</dd></div>
                            <div><dt className="text-gray-500">Study Type</dt><dd>{application.study_type}</dd></div>
                            <div><dt className="text-gray-500">Study Design</dt><dd>{application.study_design}</dd></div>
                            <div><dt className="text-gray-500">Vulnerable Population</dt><dd>{application.vulnerable_population ? 'Yes' : 'No'}</dd></div>
                            <div><dt className="text-gray-500">Target Population</dt><dd>{application.target_population}</dd></div>
                            <div><dt className="text-gray-500">Participant Count</dt><dd>{application.participant_count}</dd></div>
                        </dl>

                        {application.status === 'clearance_issued' && (
                            <a
                                href={route('remis.clearance-pdf', application.id)}
                                className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
                            >
                                Download joint clearance certificate (Form 3)
                            </a>
                        )}

                        <a
                            href={route('incidents.create', application.id)}
                            className="mt-4 ml-4 inline-block text-sm text-red-600 hover:underline"
                        >
                            Report Incident
                        </a>
                    </div>

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold">Endorsement Chain</h3>
                        <ul className="space-y-1 text-sm">
                            {application.endorsement_actions?.map((e) => (
                                <li key={e.id}>
                                    <span className="font-semibold">{e.step}</span>: {e.action} by {e.endorser?.name}
                                    {e.remarks && ` — "${e.remarks}"`}
                                </li>
                            ))}
                            {(!application.endorsement_actions || application.endorsement_actions.length === 0) && (
                                <li className="text-gray-500">No endorsement actions yet.</li>
                            )}
                        </ul>
                    </div>

                    {reviewAssignments.length > 0 && (
                        <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                            <h3 className="mb-4 text-lg font-semibold">Review Panel</h3>
                            <ul className="space-y-2 text-sm">
                                {reviewAssignments.map((ra) => (
                                    <li key={ra.id} className="rounded-md border border-gray-200 p-3">
                                        <p className="font-semibold">{ra.reviewer?.name}</p>
                                        {ra.submitted_at ? (
                                            <>
                                                <p>
                                                    <span className="font-semibold">Recommendation:</span>{' '}
                                                    {ra.recommendation?.replace('_', ' ')}
                                                </p>
                                                {ra.comments && <p className="text-gray-600">"{ra.comments}"</p>}
                                                <p className="mt-1 text-xs text-gray-500">Submitted {ra.submitted_at}</p>
                                            </>
                                        ) : (
                                            <p className="text-gray-500">Recommendation pending.</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {['monitoring', 'closed', 'archived'].includes(application.status) && (
                        <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                            <h3 className="mb-4 text-lg font-semibold">Monitoring &amp; Completion</h3>

                            {application.completion_report && (
                                <div className="mb-4 rounded-md bg-gray-50 p-4 text-sm">
                                    <p className="font-semibold">
                                        Final Ethics Completion Report — {application.completion_report.final_outcome}
                                    </p>
                                    <p>Completion Date: {application.completion_report.completion_date}</p>
                                    <p>Final Participant Count: {application.completion_report.final_participant_count}</p>
                                    <p>Publication Status: {application.completion_report.publication_status}</p>
                                    <p>Data Storage Location: {application.completion_report.data_storage_location}</p>
                                    <p className="mt-1 text-gray-600">{application.completion_report.compliance_statement}</p>
                                    {application.completion_report.archived_at && (
                                        <p className="mt-2 text-xs text-gray-500">
                                            Archived at {application.completion_report.archived_at}
                                        </p>
                                    )}
                                </div>
                            )}

                            <h4 className="mb-2 text-sm font-semibold text-gray-700">Progress Reports</h4>
                            <ul className="mb-4 space-y-3">
                                {(application.progress_reports ?? []).length === 0 && (
                                    <li className="text-sm text-gray-500">No progress reports submitted yet.</li>
                                )}
                                {(application.progress_reports ?? []).map((r) => (
                                    <li key={r.id} className="rounded-md border border-gray-200 p-3 text-sm">
                                        <p><span className="font-semibold">Status of Study:</span> {r.status_of_study}</p>
                                        <p><span className="font-semibold">Participants Recruited:</span> {r.participants_recruited}</p>
                                        {r.ethics_concerns && <p><span className="font-semibold">Ethics Concerns:</span> {r.ethics_concerns}</p>}
                                        {r.protocol_deviations && <p><span className="font-semibold">Protocol Deviations:</span> {r.protocol_deviations}</p>}
                                        {r.corrective_actions && <p><span className="font-semibold">Corrective Actions:</span> {r.corrective_actions}</p>}
                                        <p className="mt-1 text-xs text-gray-500">
                                            Submitted by {r.submitter?.name} at {r.submitted_at}
                                        </p>

                                        {r.compliance_status ? (
                                            <p className="mt-2 text-sm">
                                                <span className="font-semibold">Compliance:</span>{' '}
                                                {COMPLIANCE_LABELS[r.compliance_status] ?? r.compliance_status}
                                                {r.review_notes && ` — "${r.review_notes}"`}
                                                <span className="ml-1 text-xs text-gray-500">
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
                                                className="mt-2 space-y-2 border-t pt-2"
                                            >
                                                <select
                                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                                    value={reviewDraft(r.id).compliance_status}
                                                    onChange={(e) => setReviewDraft(r.id, { compliance_status: e.target.value })}
                                                >
                                                    <option value="compliant">Compliant</option>
                                                    <option value="minor_issues">Minor Issues</option>
                                                    <option value="major_issues">Major Issues</option>
                                                    <option value="non_compliant">Non-Compliant</option>
                                                </select>
                                                <textarea
                                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                                    placeholder="Review notes"
                                                    value={reviewDraft(r.id).review_notes}
                                                    onChange={(e) => setReviewDraft(r.id, { review_notes: e.target.value })}
                                                />
                                                <PrimaryButton>Log Compliance Review</PrimaryButton>
                                            </form>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {isApplicant && application.status === 'monitoring' && (
                                <div className="space-y-6 border-t pt-4">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            progressForm.post(route('remis.progress-reports.store', application.id), {
                                                forceFormData: true,
                                                onSuccess: () => progressForm.reset(),
                                            });
                                        }}
                                        className="space-y-2"
                                    >
                                        <h4 className="text-sm font-semibold text-gray-700">Submit Progress Report</h4>
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
                                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                            placeholder="Ethics concerns (optional)"
                                            value={progressForm.data.ethics_concerns}
                                            onChange={(e) => progressForm.setData('ethics_concerns', e.target.value)}
                                        />
                                        <textarea
                                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                            placeholder="Protocol deviations (optional)"
                                            value={progressForm.data.protocol_deviations}
                                            onChange={(e) => progressForm.setData('protocol_deviations', e.target.value)}
                                        />
                                        <textarea
                                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                            placeholder="Corrective actions (optional)"
                                            value={progressForm.data.corrective_actions}
                                            onChange={(e) => progressForm.setData('corrective_actions', e.target.value)}
                                        />
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => progressForm.setData('documents', Array.from(e.target.files))}
                                        />
                                        <InputError message={progressForm.errors.progress_report} />
                                        <PrimaryButton disabled={progressForm.processing}>Submit Progress Report</PrimaryButton>
                                    </form>

                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            completionForm.post(route('remis.completion-report.store', application.id), {
                                                forceFormData: true,
                                            });
                                        }}
                                        className="space-y-2 border-t pt-4"
                                    >
                                        <h4 className="text-sm font-semibold text-gray-700">
                                            Submit Final Ethics Completion Report
                                        </h4>
                                        <p className="text-xs text-gray-500">
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
                                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm"
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
                                        />
                                        <InputError message={completionForm.errors.completion_report} />
                                        <DangerButton disabled={completionForm.processing}>
                                            Submit Completion Report
                                        </DangerButton>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="mb-4 text-lg font-semibold">Actions</h3>

                        {canEndorse && (
                            <form
                                onSubmit={(e) => { e.preventDefault(); endorseForm.post(route('remis.endorse', application.id)); }}
                                className="space-y-2"
                            >
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm"
                                    value={endorseForm.data.action}
                                    onChange={(e) => endorseForm.setData('action', e.target.value)}
                                >
                                    <option value="approve">Approve (forward to next endorser)</option>
                                    <option value="return">Return with Comments</option>
                                    <option value="reject">Reject</option>
                                </select>
                                <textarea
                                    className="block w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="Remarks"
                                    value={endorseForm.data.remarks}
                                    onChange={(e) => endorseForm.setData('remarks', e.target.value)}
                                />
                                <TextInput
                                    className="block w-full"
                                    placeholder="Type your full name to sign"
                                    value={endorseForm.data.signature}
                                    onChange={(e) => endorseForm.setData('signature', e.target.value)}
                                />
                                <SignaturePad onChange={(image) => endorseForm.setData('signature_image', image)} />
                                <InputError message={endorseForm.errors.endorse} />
                                <PrimaryButton disabled={endorseForm.processing}>Submit Endorsement</PrimaryButton>
                            </form>
                        )}

                        {isApplicant && application.status === 'for_revision' && (
                            <PrimaryButton onClick={() => router.post(route('remis.resubmit', application.id))}>
                                Resubmit
                            </PrimaryButton>
                        )}

                        {roleName === 'ethics_secretariat' && application.status === 'for_screening' && (
                            <form
                                onSubmit={(e) => { e.preventDefault(); screenForm.post(route('remis.screen', application.id)); }}
                                className="space-y-2"
                            >
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm"
                                    value={screenForm.data.decision}
                                    onChange={(e) => screenForm.setData('decision', e.target.value)}
                                >
                                    <option value="complete">Complete</option>
                                    <option value="incomplete">Incomplete</option>
                                    <option value="returned_for_compliance">Returned for Compliance</option>
                                </select>
                                <textarea
                                    className="block w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="Comments"
                                    value={screenForm.data.comments}
                                    onChange={(e) => screenForm.setData('comments', e.target.value)}
                                />
                                <PrimaryButton disabled={screenForm.processing}>Submit Screening</PrimaryButton>
                            </form>
                        )}

                        {roleName === 'ethics_committee_chair' && application.status === 'for_review' && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    assignForm.post(route('remis.assign-reviewer', application.id), {
                                        onSuccess: () => assignForm.reset(),
                                    });
                                }}
                                className="flex items-end gap-2"
                            >
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
                                <PrimaryButton disabled={assignForm.processing}>
                                    {reviewAssignments.length === 0 ? 'Assign Reviewer' : 'Assign Another Reviewer'}
                                </PrimaryButton>
                            </form>
                        )}

                        {isAssignedReviewer && application.status === 'for_review' && !myAssignment.submitted_at && (
                            <form
                                onSubmit={(e) => { e.preventDefault(); reviewForm.post(route('remis.submit-review', application.id)); }}
                                className="space-y-2"
                            >
                                <SecondaryButton type="button" disabled className="cursor-default">Risk Classification &amp; Review</SecondaryButton>
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm"
                                    value={reviewForm.data.risk_level}
                                    onChange={(e) => reviewForm.setData('risk_level', e.target.value)}
                                >
                                    <option value="minimal">Minimal Risk (Expedited)</option>
                                    <option value="moderate">Moderate Risk (Committee)</option>
                                    <option value="high">High Risk (Full Board)</option>
                                </select>
                                <textarea
                                    className="block w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="Classification rationale"
                                    value={reviewForm.data.rationale}
                                    onChange={(e) => reviewForm.setData('rationale', e.target.value)}
                                />
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm"
                                    value={reviewForm.data.recommendation}
                                    onChange={(e) => reviewForm.setData('recommendation', e.target.value)}
                                >
                                    <option value="approve">Approve</option>
                                    <option value="minor_revision">Minor Revision</option>
                                    <option value="major_revision">Major Revision</option>
                                    <option value="disapprove">Disapprove</option>
                                </select>
                                <textarea
                                    className="block w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="Review comments"
                                    value={reviewForm.data.comments}
                                    onChange={(e) => reviewForm.setData('comments', e.target.value)}
                                />
                                <PrimaryButton disabled={reviewForm.processing}>Submit Review</PrimaryButton>
                            </form>
                        )}

                        {roleName === 'ethics_committee_chair' && application.status === 'for_review' && allReviewersSubmitted && (
                            <form
                                onSubmit={(e) => { e.preventDefault(); decideForm.post(route('remis.decide', application.id)); }}
                                className="space-y-2"
                            >
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm"
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
                                        className="block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="Conditions"
                                        value={decideForm.data.conditions}
                                        onChange={(e) => decideForm.setData('conditions', e.target.value)}
                                    />
                                )}
                                <textarea
                                    className="block w-full rounded-md border-gray-300 shadow-sm"
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
                                <DangerButton disabled={decideForm.processing}>Issue Decision</DangerButton>
                            </form>
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
