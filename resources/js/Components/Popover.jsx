import { useEffect, useRef, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';

// A toolbar popover that — unlike the shared Dropdown — stays open while you toggle options inside
// it (needed for Filters / Hide-fields checklists on the list tables). Closes on outside click or
// Escape. Redesign system: pill trigger, rounded soft-shadow menu.
export default function Popover({ label, icon: Icon, children, align = 'left', badge }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-medium bg-surface-secondary px-4 text-sm font-semibold text-fg-secondary transition-colors hover:bg-surface-tertiary"
            >
                {Icon && <Icon size={16} />}
                {label}
                {badge != null && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{badge}</span>
                )}
                <IconChevronDown size={14} className="text-fg-tertiary" />
            </button>
            {open && (
                <div className={`absolute z-40 mt-2 w-56 rounded-xl border border-border bg-surface-secondary p-1.5 shadow-hover ${align === 'right' ? 'right-0' : 'left-0'}`}>
                    {children}
                </div>
            )}
        </div>
    );
}
