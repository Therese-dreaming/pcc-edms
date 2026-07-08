// docs/DESIGN.md — replaces the copy-pasted `min-w-full divide-y
// divide-gray-200 text-sm` thead/tbody recipe used across 18+ list pages.
// Flattened Linear/Stripe-style: hairline rows, no filled header band, no
// card shadow — the surrounding page section supplies the border/elevation.
export function Table({ children, className = '' }) {
    return (
        <div className="overflow-hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className={`min-w-full divide-y divide-zinc-200 text-sm ${className}`}>{children}</table>
        </div>
    );
}

export function THead({ children }) {
    return <thead className="bg-white">{children}</thead>;
}

export function TBody({ children }) {
    return <tbody className="divide-y divide-zinc-100 bg-white">{children}</tbody>;
}

export function Tr({ children, className = '' }) {
    return <tr className={`transition-colors hover:bg-zinc-50/70 ${className}`}>{children}</tr>;
}

// Literal class map, not string interpolation — Tailwind's scanner only
// picks up whole class names it can see verbatim in source.
const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

export function Th({ children, className = '', align = 'left' }) {
    return (
        <th
            className={`border-b border-zinc-200 px-4 py-2.5 ${ALIGN[align]} text-xs font-medium text-zinc-500 ${className}`}
        >
            {children}
        </th>
    );
}

export function Td({ children, className = '', align = 'left' }) {
    return <td className={`px-4 py-3 font-content ${ALIGN[align]} text-zinc-800 ${className}`}>{children}</td>;
}

export function EmptyRow({ colSpan, children = 'Nothing here.' }) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-zinc-500">
                {children}
            </td>
        </tr>
    );
}
