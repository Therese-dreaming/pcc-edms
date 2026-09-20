import InputError from '@/Components/InputError';
import {
    PANEL, PANEL_HEAD, PANEL_TITLE, PANEL_EYEBROW, PRIMARY_BTN, TEXTAREA,
} from './primitives';

const DANGER_BTN =
    'inline-flex items-center rounded-lg bg-red-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-red-800 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0';
const SUCCESS_BTN =
    'inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:translate-y-px';
const AMBER_BTN =
    'inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-amber-800 active:translate-y-px disabled:opacity-50';

// Workflow Actions panel — the role-gated action blocks (start review, return, resubmit,
// reject, approve, admin transfer) plus the terminal "no actions" state. Handlers and forms
// live in the page; this component is presentational and keeps the original gating logic.
export default function ActionsPanel({
    application, isOwner, canScreenerAct, isAdmin, legalTransitions,
    transferForm, approveError,
    onStartReview, onResubmit, onReject, onApprove,
}) {
    const status = application.status;
    const hasWorkflowActions =
        (canScreenerAct && status === 'submitted') ||
        (isOwner && status === 'returned') ||
        (canScreenerAct && status === 'under_review') ||
        isAdmin ||
        (legalTransitions.length === 0 && !canScreenerAct);

    if (!hasWorkflowActions) return null;

    return (
        <div className={PANEL}>
            <div className={PANEL_HEAD}>
                <div>
                    <p className={PANEL_EYEBROW}>Review</p>
                    <h3 className={PANEL_TITLE}>Workflow Actions</h3>
                </div>
            </div>

            <div className="space-y-4 p-6">
                {/* Start Review */}
                {canScreenerAct && status === 'submitted' && (
                    <button onClick={onStartReview} className={PRIMARY_BTN}>
                        Start Review
                    </button>
                )}

                {/* "Return for Correction" is intentionally NOT a separate box here anymore — a
                    mandatory comment from the Revision panel above is the single way to send the
                    application back to the researcher (it both transitions to `returned` AND records
                    a tracked, resolvable item). The dpreq.return endpoint still exists for the
                    lifecycle tests / direct API use. */}

                {/* Resubmit */}
                {isOwner && status === 'returned' && (
                    <div className="rounded-lg bg-primary-50 p-4 ring-1 ring-inset ring-primary-200/70">
                        <h4 className="text-[0.8125rem] font-semibold text-fg-primary">Ready to Resubmit?</h4>
                        <p className="mb-3 mt-1 text-xs text-fg-secondary">
                            Once you''ve addressed the feedback, resubmit your application for review.
                        </p>
                        <button onClick={onResubmit} className={PRIMARY_BTN}>
                            Resubmit Application
                        </button>
                    </div>
                )}

                {/* Reject */}
                {canScreenerAct && status === 'under_review' && (
                    <div className="space-y-3 rounded-lg bg-red-50 p-4 ring-1 ring-inset ring-red-200">
                        <h4 className="text-[0.8125rem] font-semibold text-fg-primary">Reject Application</h4>
                        <p className="text-xs text-fg-secondary">
                            You''ll be asked for a reason and your account password to confirm.
                        </p>
                        <button type="button" onClick={onReject} className={DANGER_BTN}>
                            Reject Application
                        </button>
                    </div>
                )}

                {/* Approve */}
                {canScreenerAct && status === 'under_review' && (
                    <div className="rounded-lg bg-emerald-50 p-4 ring-1 ring-inset ring-emerald-200">
                        <h4 className="text-[0.8125rem] font-semibold text-fg-primary">Final Approval</h4>
                        <p className="mb-3 mt-1 text-xs text-fg-secondary">
                            Approving opens the Research Team NDA for the team to sign; the clearance is issued once everyone has signed.
                        </p>
                        {approveError && (
                            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                                {approveError}
                            </p>
                        )}
                        <button onClick={onApprove} className={SUCCESS_BTN}>
                            Approve Application
                        </button>
                    </div>
                )}

                {/* Transfer ownership (admin only, B3 / concern 3.4) */}
                {isAdmin && ['rejected'].includes(status) === false && (
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
                        <h4 className="text-[0.8125rem] font-semibold text-fg-primary">Transfer Ownership</h4>
                        <p className="text-xs text-fg-secondary">
                            Reassign this application to a new lead (e.g. the current lead left the school). Submitted documents and signatures are preserved; the previous lead''s account is deactivated.
                        </p>
                        <input
                            type="email"
                            placeholder="New lead''s account email"
                            className={TEXTAREA}
                            value={transferForm.data.new_leader_email}
                            onChange={(e) => transferForm.setData('new_leader_email', e.target.value)}
                        />
                        <InputError message={transferForm.errors.new_leader_email} />
                        <button type="submit" disabled={transferForm.processing} className={AMBER_BTN}>
                            {transferForm.processing ? 'Transferring…' : 'Transfer Ownership'}
                        </button>
                    </form>
                )}

                {/* No actions */}
                {legalTransitions.length === 0 && !canScreenerAct && !isAdmin && (
                    <div className="rounded-lg bg-surface-tertiary p-4 ring-1 ring-inset ring-border">
                        <h4 className="text-[0.8125rem] font-semibold text-fg-primary">No Actions Available</h4>
                        <p className="mt-1 text-xs text-fg-secondary">
                            This application is in a terminal state. No further actions can be taken.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}