// Lightweight horizontal bar visualization (no charting library in this project yet) — used by
// report pages that call for a "bar chart" or "pie chart" output (docs/5.1-5.3). Renders counts
// keyed by label, e.g. { minimal: 4, moderate: 2 }.
export default function BarList({ counts, labels = {} }) {
    const entries = Object.entries(counts ?? {});
    const max = Math.max(1, ...entries.map(([, count]) => count));

    if (entries.length === 0) {
        return <p className="text-sm text-zinc-500">No data for the selected filters.</p>;
    }

    return (
        <div className="space-y-2">
            {entries.map(([key, count]) => (
                <div key={key} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 truncate text-sm text-zinc-600">
                        {labels[key] ?? key}
                    </div>
                    <div className="h-4 flex-1 rounded bg-zinc-100">
                        <div
                            className="h-4 rounded bg-primary-600"
                            style={{ width: `${(count / max) * 100}%` }}
                        />
                    </div>
                    <div className="w-10 shrink-0 text-right text-sm font-medium text-zinc-700">
                        {count}
                    </div>
                </div>
            ))}
        </div>
    );
}
