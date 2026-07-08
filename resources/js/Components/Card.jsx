// docs/DESIGN.md — replaces the copy-pasted `overflow-hidden bg-white p-6
// shadow-sm sm:rounded-lg` wrapper used across 25+ pages. Flat by design: a
// hairline border does the separating, not a shadow — no glow rings, no
// heavy elevation.
export default function Card({ title, actions, children, className = '', bodyClassName = 'p-6' }) {
    return (
        <div className={`overflow-hidden rounded-lg border border-zinc-200 bg-white ${className}`}>
            {(title || actions) && (
                <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
                    {title && (
                        <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-primary-700">
                            {title}
                        </h3>
                    )}
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className={bodyClassName}>{children}</div>
        </div>
    );
}
