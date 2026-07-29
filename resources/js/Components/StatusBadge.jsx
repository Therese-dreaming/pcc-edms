// docs/DESIGN.md — every status across DPREQ/DPNDA/REMIS/Incidents rendered
// through one component instead of unstyled plain text. Variant is looked up
// by raw status value; the same word means the same thing everywhere (e.g.
// "approved" is success whether it's a DPREQ or REMIS status), so one map
// covers every module rather than one per module.
const VARIANT = {
    // neutral — not yet in motion
    draft: 'neutral',
    draft_submitted: 'neutral',

    // warning — in progress / awaiting someone
    submitted: 'warning',
    screening: 'warning',
    under_review: 'warning',
    endorsed: 'warning',
    sent_for_signing: 'warning',
    trainee_signed: 'warning',
    under_endorsement: 'warning',
    for_screening: 'warning',
    for_review: 'warning',
    monitoring: 'warning',
    reported: 'warning',
    under_investigation: 'warning',
    corrective_action_in_progress: 'warning',
    approved_with_conditions: 'warning',
    deferred: 'warning',
    pending_validation: 'warning',

    // danger — stopped, sent back, or refused
    returned: 'danger',
    rejected: 'danger',
    declined: 'danger',
    disapproved: 'danger',
    for_revision: 'danger',
    suspended: 'danger',
    deactivated: 'danger',

    // success — resolved in the applicant's favor / done
    approved: 'success',
    clearance_issued: 'success',
    coordinator_countersigned: 'success',
    completed: 'success',
    completed_archived: 'success',
    resolved: 'success',
    closed: 'success',
    archived: 'success',
    active: 'success',
    verified: 'success',
};

// Linear-style: a colored dot + plain text, not a filled pill — status reads
// as a state indicator, not another chip competing with tracking-number chips.
const DOT = {
    neutral: 'bg-border-medium',
    warning: 'bg-warning',
    danger: 'bg-danger',
    success: 'bg-success',
};

export default function StatusBadge({ status, label }) {
    const variant = VARIANT[status] ?? 'neutral';

    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize text-fg-secondary">
            <span className={`h-1.5 w-1.5 rounded-full ${DOT[variant]}`} aria-hidden="true" />
            {label ?? status?.replace(/_/g, ' ')}
        </span>
    );
}
