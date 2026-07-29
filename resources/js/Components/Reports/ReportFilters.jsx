// Shared filter bar + table primitives for report pages. Redesign system
// (.claude/skills/redesign): pill inputs, neutral surfaces, dark-red primary "Apply" button,
// horizontal-divider-only tables.

export function FilterBar({ onSubmit, children }) {
    return (
        <form
            onSubmit={onSubmit}
            className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-primary p-4 shadow-resting"
        >
            {children}
            <button
                type="submit"
                className="ml-auto inline-flex min-h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-strong focus:outline-none focus-visible:ring-3 focus-visible:ring-primary-soft"
            >
                Apply
            </button>
        </form>
    );
}

const fieldClasses =
    'mt-1.5 block w-full rounded-full border-border-medium bg-surface-secondary text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-primary focus:ring-3 focus:ring-primary-soft';

export function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold text-fg-secondary">{label}</span>
            {children}
        </label>
    );
}

export function TextField({ label, value, onChange, placeholder }) {
    return (
        <Field label={label}>
            <input type="text" value={value} onChange={onChange} placeholder={placeholder} className={fieldClasses} />
        </Field>
    );
}

export function DateField({ label, value, onChange }) {
    return (
        <Field label={label}>
            <input type="date" value={value} onChange={onChange} className={fieldClasses} />
        </Field>
    );
}

export function SelectField({ label, value, onChange, children }) {
    return (
        <Field label={label}>
            <select value={value} onChange={onChange} className={fieldClasses}>
                {children}
            </select>
        </Field>
    );
}

// A plain data table matching the redesign table pattern (horizontal dividers only, muted
// uppercase header). `columns` = [{ key, label, className?, render?(row) }]. `rows` = array.
export function ReportTable({ columns, rows, empty = 'No data for the selected filters.', rowKey = (r, i) => i }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-primary shadow-resting">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-border">
                        {columns.map((col) => (
                            <th key={col.key} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-tertiary">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-fg-tertiary">{empty}</td>
                        </tr>
                    ) : (
                        rows.map((row, i) => (
                            <tr key={rowKey(row, i)} className="border-b border-border last:border-0 hover:bg-surface-tertiary/50">
                                {columns.map((col) => (
                                    <td key={col.key} className={`px-5 py-3.5 text-sm text-fg-secondary ${col.className ?? ''}`}>
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

// Small pill for a tracking number, matching the interior-page chip convention.
export function TrackingPill({ children }) {
    return (
        <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
            {children}
        </span>
    );
}
