import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RevisionPanel from '@/Components/RevisionPanel';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { confirmAction, confirmDanger, confirmWithPassword, notifySuccess, notifyResultError } from '@/lib/confirm';
import HeaderBar from './Show/HeaderBar';
import SectionPanels from './Show/SectionPanels';
import { GeneratedDocumentsPanel, SubmittedDocumentsPanel } from './Show/DocumentsPanel';
import NdaPanel from './Show/NdaPanel';
import ActionsPanel from './Show/ActionsPanel';
import Sidebar from './Show/Sidebar';
import { PANEL, GENERATED_DOC_TYPES } from './Show/primitives';

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
        const ok = await confirmAction({ title: 'Begin reviewing this application?', text: 'It will move to "Under Review" and the applicant will be notified.', confirmText: 'Start Review' });
        if (ok) router.post(route('dpreq.start-review', application.id));
    };
    const handleResubmit = async () => {
        const ok = await confirmAction({ title: 'Resubmit this application?', text: 'It will go back to the DPO for review.', confirmText: 'Resubmit' });
        if (ok) router.post(
            route('dpreq.resubmit', application.id),
            {},
            {
                preserveScroll: true,
                // Blocked resubmits (e.g. an outstanding mandatory revision) land in the error bag
                // under `action` — surface them, since flash toasts only cover flash.* keys.
                onError: (errs) => notifyResultError('Could not resubmit', errs.action || 'Please review the outstanding items and try again.'),
            },
        );
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
    const isAdmin = roleName === 'system_administrator';

    // DPO clearance is issued independently of the Ethics track (stakeholder-additional-features.md).
    const clearanceIssued = Boolean(research.clearance_certificate?.dpreq_issued_at);

    return (
        <AuthenticatedLayout>
            <Head title={application.tracking_number} />

            <div className="py-8 font-sans text-fg-primary [font-optical-sizing:auto]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <HeaderBar
                        application={application}
                        research={research}
                        isOwner={isOwner}
                        canScreenerAct={canScreenerAct}
                        onStartReview={handleStartReview}
                        onResubmit={handleResubmit}
                        onApprove={handleApprove}
                    />

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

                            <SectionPanels application={application} research={research} />

                            <GeneratedDocumentsPanel application={application} form1Document={form1Document} />
                            <SubmittedDocumentsPanel documents={submittedDocuments} />

                            <NdaPanel
                                application={application}
                                nda={nda}
                                mySignatory={mySignatory}
                                canManageMembers={canManageMembers}
                                signForm={signForm}
                                memberForm={memberForm}
                                onResendMember={handleResendMember}
                                onRemoveMember={handleRemoveMember}
                            />

                            <ActionsPanel
                                application={application}
                                isOwner={isOwner}
                                canScreenerAct={canScreenerAct}
                                isAdmin={isAdmin}
                                legalTransitions={legalTransitions}
                                transferForm={transferForm}
                                approveError={approveError}
                                onStartReview={handleStartReview}
                                onResubmit={handleResubmit}
                                onReject={handleReject}
                                onApprove={handleApprove}
                            />
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="lg:col-span-1">
                            <div className="space-y-6 lg:sticky lg:top-6">
                                <Sidebar
                                    application={application}
                                    research={research}
                                    clearanceIssued={clearanceIssued}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}