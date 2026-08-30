// Submission-history timeline (stakeholder "Future Enhancements", built 2026-08-31) — renders a
// record's status_history rows chronologically. Shared by the DPREQ/REMIS/DPNDA show pages;
// each page passes its own status label map.
export default function StatusTimeline({ history = [], labels = {} }) {
    const entries = [...history].reverse(); // history arrives newest-first; show oldest-first

    if (entries.length === 0) {
        return <p className="text-sm text-fg-tertiary">No history recorded yet.</p>;
    }

    const label = (status) => labels[status] ?? (status ?? 'Created').replaceAll('_', ' ');

    return (
        <ol className="relative space-y-4 border-l border-border-medium pl-5">
            {entries.map((h, i) => (
                <li key={h.id ?? i} className="relative">
                    <span
                        className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-surface-secondary ${
                            i === entries.length - 1 ? 'bg-primary-700' : 'bg-border-medium'
                        }`}
                    />
                    <p className="text-sm font-semibold text-fg-primary">
                        {h.from_status ? `${label(h.from_status)} → ` : ''}
                        {label(h.to_status)}
                    </p>
                    {h.comments && (
                        <p className="mt-0.5 text-sm leading-relaxed text-fg-secondary">“{h.comments}”</p>
                    )}
                    <p className="mt-0.5 text-xs text-fg-tertiary">
                        {h.created_at}
                        {h.changed_by?.name ? ` — ${h.changed_by.name}` : ''}
                    </p>
                </li>
            ))}
        </ol>
    );
}
