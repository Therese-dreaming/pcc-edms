import { Link } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import ProgressStepper from './ProgressStepper';
import WhatsNext from './WhatsNext';
import {
    STATUS_LABELS,
    PANEL_EYEBROW,
    PRIMARY_BTN,
    SECONDARY_BTN,
    formatDate,
} from './primitives';

// Header — typographic, no icon. Owns the eyebrow/title/meta row and the primary action row.
// Phase 2 polish: the application's single most relevant action for THIS viewer is the one
// filled primary button; everything else is demoted to a secondary/outline control. The
// researcher also gets a progress stepper + "what happens next" guidance under the header.
export default function HeaderBar({
    application,
    research,
    isOwner,
    canScreenerAct,
    onStartReview,
    onResubmit,
    onApprove,
}) {
    return (
        <div className="mb-8 border-b border-border pb-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <p className={PANEL_EYEBROW}>DPREQ Application</p>
                        <span className="text-border-medium">/</span>
                        <span className="font-display text-xs font-semibold tabular-nums text-fg-tertiary">
                            {application.tracking_number}
                        </span>
                    </div>
                    <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">
                        {research.research_title || (
                            <span className="text-fg-tertiary">Untitled Application</span>
                        )}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-tertiary">
                        <span className="font-medium text-fg-secondary">
                            {application.applicant?.name || 'Unknown applicant'}
                        </span>
                        <span className="text-border-medium">•</span>
                        <StatusBadge
                            status={application.status}
                            label={STATUS_LABELS[application.status]}
                        />
                        {research.target_start_date && (
                            <>
                                <span className="text-border-medium">•</span>
                                <span>
                                    {formatDate(research.target_start_date)} —{' '}
                                    {formatDate(research.target_end_date) || 'Ongoing'}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <a href={route('dpreq.form-pdf', application.id)} className={SECONDARY_BTN}>
                        Download Form 1
                    </a>
                    {isOwner && ['draft', 'returned'].includes(application.status) && (
                        <Link href={route('dpreq.edit', application.id)} className={SECONDARY_BTN}>
                            Edit
                        </Link>
                    )}
                    {canScreenerAct && application.status === 'submitted' && (
                        <button onClick={onStartReview} className={PRIMARY_BTN}>
                            Start Review
                        </button>
                    )}
                    {isOwner && application.status === 'returned' && (
                        <button onClick={onResubmit} className={PRIMARY_BTN}>
                            Resubmit
                        </button>
                    )}
                    {canScreenerAct && application.status === 'under_review' && (
                        <button onClick={onApprove} className={PRIMARY_BTN}>
                            Approve
                        </button>
                    )}
                </div>
            </div>

            {/* Researcher-facing orientation: progress + what happens next. Internal reviewers
                (DPO staff / admin) have the workflow panel instead, so this stays owner-only. */}
            {isOwner && (
                <div className="mt-6 space-y-3">
                    <ProgressStepper status={application.status} />
                    <WhatsNext status={application.status} />
                </div>
            )}
        </div>
    );
}
