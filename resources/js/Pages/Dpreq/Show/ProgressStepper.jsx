import { STATUS_LABELS } from './primitives';

// Ordered happy-path lifecycle for the DPREQ (DPO) track. `returned` and `rejected` are
// branches off this main line, handled separately as callouts rather than stepper states.
const STEPS = ['draft', 'submitted', 'under_review', 'approved', 'clearance_issued'];

// Researcher-facing progress stepper (Phase 2 UX polish). Shows where the application sits
// on the happy path. When the application has been sent back (`returned`) or `rejected`,
// the stepper still shows the furthest happy-path point reached and the branch is
// communicated by the WhatsNext callout + StatusBadge instead of a broken stepper.
export default function ProgressStepper({ status }) {
    // A `returned` application was sent back from `under_review`; a resubmit puts it back at
    // `submitted`. Show it as sitting at the review step so the owner sees where it stalled.
    const effective = status === 'returned' ? 'under_review' : status;
    const currentIndex = STEPS.indexOf(effective);

    // `rejected` is terminal off the main line — render the stepper fully dimmed.
    const rejected = status === 'rejected';

    return (
        <ol className="flex flex-wrap items-center gap-y-2" aria-label="Application progress">
            {STEPS.map((step, i) => {
                const reached = !rejected && currentIndex !== -1 && i <= currentIndex;
                const isCurrent = !rejected && i === currentIndex;
                return (
                    <li key={step} className="flex items-center">
                        {i > 0 && (
                            <span
                                aria-hidden="true"
                                className={`mx-2 h-px w-6 sm:w-8 ${i <= currentIndex && !rejected ? 'bg-primary-300' : 'bg-border'}`}
                            />
                        )}
                        <span className="flex items-center gap-2">
                            <span
                                aria-hidden="true"
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.625rem] font-bold tabular-nums ring-1 ring-inset ${
                                    isCurrent
                                        ? 'bg-primary-700 text-white ring-primary-700'
                                        : reached
                                            ? 'bg-primary-50 text-primary-700 ring-primary-200'
                                            : 'bg-surface-tertiary text-fg-tertiary ring-border'
                                }`}
                            >
                                {reached && !isCurrent ? '✓' : i + 1}
                            </span>
                            <span
                                className={`text-xs font-medium ${
                                    isCurrent
                                        ? 'font-semibold text-primary-700'
                                        : reached
                                            ? 'text-fg-secondary'
                                            : 'text-fg-tertiary'
                                }`}
                            >
                                {STATUS_LABELS[step]}
                            </span>
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
