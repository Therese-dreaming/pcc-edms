// Redesign system (.claude/skills/redesign): one consistent accent avatar —
// solid dark-red `primary` circle with white initials, used everywhere (topbar,
// sidebar, table rows). No rotating per-person palette.
const SIZES = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
};

export function initialsFor(name = '') {
    return name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function Avatar({ name, initials, size = 'md', className = '' }) {
    const text = initials ?? initialsFor(name);
    return (
        <span
            className={`flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white ${SIZES[size]} ${className}`}
        >
            {text}
        </span>
    );
}
