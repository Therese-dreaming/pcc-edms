import { IconInbox } from '@tabler/icons-react';

export function Table({ children, className = '', ariaLabel }) {
    return (
        <div className="overflow-hidden rounded-xl border border-paper-200 bg-white">
            <div className="overflow-x-auto">
                <table aria-label={ariaLabel} className={`min-w-full border-separate border-spacing-0 font-content text-sm ${className}`}>
                    {children}
                </table>
            </div>
        </div>
    );
}

export function THead({ children }) {
    return <thead className="bg-white">{children}</thead>;
}

export function TBody({ children }) {
    return <tbody className="bg-white">{children}</tbody>;
}

export function Tr({ children, className = '' }) {
    return <tr className={`group transition-colors duration-150 hover:bg-primary-50/40 ${className}`}>{children}</tr>;
}

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

export function Th({ children, className = '', align = 'left', scope = 'col' }) {
    return (
        <th
            scope={scope}
            className={`border-b border-paper-200 px-4 py-3 font-subtitle text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-paper-400 ${ALIGN[align]} ${className}`}
        >
            {children}
        </th>
    );
}

export function Td({ children, className = '', align = 'left' }) {
    return (
        <td className={`border-b border-paper-100 px-4 py-3.5 align-middle text-paper-700 group-last:border-b-0 ${ALIGN[align]} ${className}`}>
            {children}
        </td>
    );
}

export function EmptyRow({ colSpan, title = 'No records found', children = 'Try changing your filters or search terms.' }) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-6 py-14 text-center">
                <IconInbox size={28} strokeWidth={1.6} className="mx-auto text-paper-300" aria-hidden="true" />
                <p className="mt-3 font-display text-sm font-bold text-paper-800">{title}</p>
                <p className="mx-auto mt-1 max-w-sm font-subtitle text-xs leading-relaxed text-paper-500">{children}</p>
            </td>
        </tr>
    );
}