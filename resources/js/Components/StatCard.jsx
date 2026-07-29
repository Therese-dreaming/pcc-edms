// Redesign system (.claude/skills/redesign): the standard metric tile — eyebrow
// label + optional info/trend, a large bold number, and a muted helper line, on
// a rounded soft-shadow card. Trend pills use status hues (success/danger), never
// the brand red, so the up/down signal stays legible.
export default function StatCard({ label, value, helper, icon: Icon, trend, trendDirection = 'up', className = '' }) {
    const trendStyles =
        trendDirection === 'up'
            ? 'bg-success-soft text-fg-success-strong'
            : 'bg-danger-soft text-fg-danger-strong';

    return (
        <div className={`rounded-xl border border-border bg-surface-secondary p-6 shadow-resting ${className}`}>
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] font-medium text-fg-tertiary">
                    {Icon && <Icon size={16} strokeWidth={1.9} className="text-fg-tertiary" aria-hidden="true" />}
                    {label}
                </span>
                {trend != null && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${trendStyles}`}>
                        {trendDirection === 'up' ? '↑' : '↓'} {trend}
                    </span>
                )}
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-fg-primary">{value}</div>
            {helper && <div className="mt-1 text-[13px] text-fg-tertiary">{helper}</div>}
        </div>
    );
}
