// Dependency-free SVG charts + report scaffolding for the Reports module. Redesign system
// (.claude/skills/redesign): flat surfaces, 1px border + soft shadow, dark-red primary accent,
// a small categorical ramp derived from the brand for multi-series slices. No charting library.

// A small categorical palette anchored on the brand red, then muted neutrals/status-adjacent hues
// so multi-slice charts stay legible without a rainbow. Uses CSS var tokens where possible.
export const CHART_COLORS = [
    'var(--primary)',
    '#b45309', // amber-700 tone for a warm secondary
    '#0f766e', // teal-700 cool tertiary
    '#6d28d9', // violet-700
    '#a1a1aa', // neutral
    '#be123c', // rose (danger-adjacent)
    '#15803d', // green
];

function StatTrend({ trend, direction }) {
    if (trend == null) return null;
    const up = direction !== 'down';
    return (
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${up ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
            {up ? '↑' : '↓'} {trend}
        </span>
    );
}

// KPI stat card — label + big number + optional helper line and trend pill.
export function StatCard({ label, value, helper, trend, trendDirection = 'up', icon: Icon }) {
    return (
        <div className="rounded-xl border border-border bg-surface-primary p-5 shadow-resting">
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-fg-tertiary">
                    {Icon && <Icon size={15} className="text-fg-tertiary" />}
                    {label}
                </span>
                <StatTrend trend={trend} direction={trendDirection} />
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-fg-primary tabular-nums">{value}</div>
            {helper && <div className="mt-1 text-xs text-fg-tertiary">{helper}</div>}
        </div>
    );
}

// Card shell with a tinted header bar (icon + title, optional right slot) — the report-section
// container used across every report page.
export function ReportCard({ icon: Icon, title, right, children, className = '' }) {
    return (
        <div className={`overflow-hidden rounded-xl border border-border bg-surface-primary shadow-resting ${className}`}>
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-tertiary/60 px-5 py-3.5">
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={17} className="text-primary" strokeWidth={2} />}
                    <h3 className="text-sm font-semibold text-fg-primary">{title}</h3>
                </div>
                {right}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// Donut / pie chart from a { label: count } map. Renders SVG arc segments + a legend.
export function DonutChart({ counts, labels = {}, size = 168, thickness = 26 }) {
    const entries = Object.entries(counts ?? {}).filter(([, v]) => v > 0);
    const total = entries.reduce((sum, [, v]) => sum + v, 0);

    if (total === 0) {
        return <p className="text-sm text-fg-tertiary">No data for the selected filters.</p>;
    }

    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-tertiary)" strokeWidth={thickness} />
                {entries.map(([key, value], i) => {
                    const fraction = value / total;
                    const dash = fraction * circumference;
                    const seg = (
                        <circle
                            key={key}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                            strokeWidth={thickness}
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset}
                        />
                    );
                    offset += dash;
                    return seg;
                })}
                <text x="50%" y="50%" className="rotate-90" textAnchor="middle" dominantBaseline="central" style={{ transformOrigin: 'center' }} fill="var(--fg-primary)" fontSize="26" fontWeight="700">
                    {total}
                </text>
            </svg>
            <ul className="min-w-0 flex-1 space-y-2">
                {entries.map(([key, value], i) => (
                    <li key={key} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="truncate capitalize text-fg-secondary">{labels[key] ?? key.replace(/_/g, ' ')}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-fg-tertiary">
                            <span className="font-semibold text-fg-primary">{value}</span> · {Math.round((value / total) * 100)}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Vertical column chart from a { label: count } map — good for a small number of comparable
// categories (e.g. departments). Bars use the brand primary.
export function ColumnChart({ counts, labels = {}, height = 200 }) {
    const entries = Object.entries(counts ?? {}).filter(([, v]) => v != null);
    const max = Math.max(1, ...entries.map(([, v]) => v));

    if (entries.length === 0) {
        return <p className="text-sm text-fg-tertiary">No data for the selected filters.</p>;
    }

    return (
        <div className="flex items-end gap-3 overflow-x-auto pb-1" style={{ height: height + 40 }}>
            {entries.map(([key, value]) => (
                <div key={key} className="flex min-w-[52px] flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums text-fg-primary">{value}</span>
                    <div
                        className="w-full max-w-[48px] rounded-t-lg bg-primary transition-all"
                        style={{ height: `${(value / max) * height}px`, minHeight: value > 0 ? 4 : 0 }}
                    />
                    <span className="w-full truncate text-center text-[11px] capitalize text-fg-tertiary" title={labels[key] ?? key}>
                        {labels[key] ?? key.replace(/_/g, ' ')}
                    </span>
                </div>
            ))}
        </div>
    );
}
