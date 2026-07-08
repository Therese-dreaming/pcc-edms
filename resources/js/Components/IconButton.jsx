import { Link } from '@inertiajs/react';

// docs/DESIGN.md — table row actions render as icons, not text links. Always
// pass `label` — it becomes both the accessible name (screen readers) and the
// visible tooltip (native title), since the icon alone carries no text.
const BASE =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500';

const VARIANT = {
    default: '',
    danger: 'hover:bg-danger-bg hover:text-danger-text',
};

export default function IconButton({ icon: Icon, label, variant = 'default', href, ...props }) {
    const className = `${BASE} ${VARIANT[variant]}`;

    if (href) {
        return (
            <Link href={href} title={label} aria-label={label} className={className} {...props}>
                <Icon size={18} aria-hidden="true" />
            </Link>
        );
    }

    return (
        <button type="button" title={label} aria-label={label} className={className} {...props}>
            <Icon size={18} aria-hidden="true" />
        </button>
    );
}
