import { IconAlertCircle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react';

// docs/DESIGN.md — flash/validation messages, currently rendered ad hoc per
// page with raw bg-green-50/bg-red-50 classes. One component, semantic tokens.
const STYLES = {
    success: { wrap: 'bg-success-bg text-success-text', Icon: IconCircleCheck },
    danger: { wrap: 'bg-danger-bg text-danger-text', Icon: IconAlertCircle },
    warning: { wrap: 'bg-warning-bg text-warning-text', Icon: IconAlertCircle },
    info: { wrap: 'bg-zinc-100 text-zinc-700', Icon: IconInfoCircle },
};

export default function Alert({ variant = 'info', children, className = '' }) {
    const { wrap, Icon } = STYLES[variant] ?? STYLES.info;

    return (
        <div className={`flex items-start gap-2 rounded-md p-4 text-sm ${wrap} ${className}`} role="status">
            <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>{children}</div>
        </div>
    );
}
