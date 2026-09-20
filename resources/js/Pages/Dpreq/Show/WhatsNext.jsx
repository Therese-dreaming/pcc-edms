// Researcher-facing "what happens next" guidance (Phase 2 UX polish). One short, plain
// sentence per status so the owner always knows the ball is in whose court. Only rendered
// for the application's owner — internal reviewers already have the actions panel.
const GUIDANCE = {
    draft: {
        tone: 'neutral',
        title: 'Ready to submit',
        body: 'This application is still a draft. Review the details below, then submit it to start the Data Privacy Office review.',
    },
    submitted: {
        tone: 'info',
        title: 'Waiting on the DPO',
        body: 'Your application is in the DPO queue. You’ll be notified when a staff member takes it under review.',
    },
    under_review: {
        tone: 'info',
        title: 'Under DPO review',
        body: 'A DPO staff member is reviewing your application. You’ll be notified if anything is returned for correction or once a decision is made.',
    },
    returned: {
        tone: 'warning',
        title: 'Action needed from you',
        body: 'The DPO returned this application for correction. Read their comments below, edit the application, then resubmit.',
    },
    approved: {
        tone: 'success',
        title: 'Sign the Team NDA',
        body: 'Approved! The Data Privacy Clearance is issued once you and every co-researcher have signed the Research Team NDA below.',
    },
    clearance_issued: {
        tone: 'success',
        title: 'Clearance issued',
        body: 'Your Data Privacy Clearance has been issued. Download it from the overview panel — you can verify it any time at the public verification portal.',
    },
    rejected: {
        tone: 'danger',
        title: 'Application rejected',
        body: 'This application was rejected. See the reason in the status history below; contact the DPO if you believe this is in error.',
    },
};

const TONE = {
    neutral: 'border-border bg-surface-tertiary/60 text-fg-secondary',
    info: 'border-primary-200 bg-primary-50 text-primary-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
};

const TITLE_TONE = {
    neutral: 'text-fg-primary',
    info: 'text-primary-800',
    success: 'text-emerald-800',
    warning: 'text-amber-800',
    danger: 'text-red-800',
};

export default function WhatsNext({ status }) {
    const g = GUIDANCE[status];
    if (!g) return null;
    return (
        <div className={`rounded-lg border px-4 py-3 ring-1 ring-inset ${TONE[g.tone]}`} role="status">
            <p className={`text-[0.8125rem] font-semibold ${TITLE_TONE[g.tone]}`}>{g.title}</p>
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed">{g.body}</p>
        </div>
    );
}
