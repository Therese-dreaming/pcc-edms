// Horizontal bar visualization (no charting library in this project) — redesign system
// (.claude/skills/redesign): neutral track, dark-red primary fill, tabular counts. Renders counts
// keyed by label, e.g. { minimal: 4, moderate: 2 }.
export default function BarList({ counts, labels = {} }) {
    const entries = Object.entries(counts ?? {});
    const max = Math.max(1, ...entries.map(([, count]) => count));
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    if (entries.length === 0) {
        return <p className="text-sm text-fg-tertiary">No data for the selected filters.</p>;
    }

    return (
        <div className="space-y-3">
            {entries.map(([key, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                    <div key={key}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                            <span className="truncate font-medium capitalize text-fg-secondary">{labels[key] ?? key.replace(/_/g, ' ')}</span>
                            <span className="shrink-0 tabular-nums text-fg-tertiary">
                                <span className="font-semibold text-fg-primary">{count}</span> · {pct}%
                            </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-surface-tertiary">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${(count / max) * 100}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
