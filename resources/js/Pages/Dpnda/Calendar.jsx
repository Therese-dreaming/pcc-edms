import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { initialsFor } from '@/Components/Avatar';
import { Head, router } from '@inertiajs/react';
import { IconChevronLeft, IconChevronRight, IconClock, IconMapPin, IconX } from '@tabler/icons-react';
import { useMemo, useState } from 'react';

const PANEL = 'overflow-hidden rounded-xl border border-border bg-surface-secondary shadow-resting';
const PANEL_EYEBROW = 'text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700';
const MICRO_LABEL = 'text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-fg-tertiary';
const PILL_BTN =
    'inline-flex items-center gap-1.5 rounded-full border border-border-medium bg-surface-secondary px-3.5 py-2 text-xs font-semibold text-fg-secondary shadow-sm transition hover:bg-surface-tertiary active:translate-y-px';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n) => String(n).padStart(2, '0');

const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${pad(m)} ${period}`;
};

const formatRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`;

const titleCase = (value = '') => value.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

// Expand a month ("YYYY-MM") into a 6x7 grid of { date: 'YYYY-MM-DD', day, inMonth } cells.
function buildGrid(year, monthIndex) {
    const firstDow = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells = [];

    // Leading cells from the previous month.
    const prevDays = new Date(year, monthIndex, 0).getDate();
    for (let i = firstDow - 1; i >= 0; i--) {
        const d = new Date(year, monthIndex - 1, prevDays - i);
        cells.push({ date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, day: d.getDate(), inMonth: false });
    }
    // Current month.
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ date: `${year}-${pad(monthIndex + 1)}-${pad(d)}`, day: d, inMonth: true });
    }
    // Trailing cells to fill the last week.
    let next = 1;
    while (cells.length % 7 !== 0) {
        const d = new Date(year, monthIndex + 1, next++);
        cells.push({ date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, day: d.getDate(), inMonth: false });
    }
    return cells;
}

export default function Calendar({ placements = [], month }) {
    const [selectedDate, setSelectedDate] = useState(null);

    const [year, monthIndex] = useMemo(() => month.split('-').map(Number).map((n, i) => (i === 1 ? n - 1 : n)), [month]);
    const cells = useMemo(() => buildGrid(year, monthIndex), [year, monthIndex]);
    const todayStr = useMemo(() => {
        const t = new Date();
        return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    }, []);

    const goToMonth = (delta) => {
        const d = new Date(year, monthIndex + delta, 1);
        router.get(route('dpnda.calendar'), { month: `${d.getFullYear()}-${pad(d.getMonth() + 1)}` }, { preserveState: true, preserveScroll: true });
    };
    const goToToday = () => {
        const t = new Date();
        router.get(route('dpnda.calendar'), { month: `${t.getFullYear()}-${pad(t.getMonth() + 1)}` }, { preserveState: true, preserveScroll: true });
    };

    // For a given date, the placements active that day plus their schedule blocks for that weekday.
    const entriesFor = (dateStr, dow) =>
        placements
            .filter((p) => p.start_date <= dateStr && p.end_date >= dateStr)
            .map((p) => ({ placement: p, blocks: p.schedules.filter((s) => s.day_of_week === dow) }));

    const selected = selectedDate
        ? {
              date: selectedDate,
              dow: new Date(selectedDate + 'T00:00:00').getDay(),
              entries: entriesFor(selectedDate, new Date(selectedDate + 'T00:00:00').getDay()),
          }
        : null;

    return (
        <AuthenticatedLayout>
            <Head title="Deployment Calendar" />

            <div className="py-8 font-sans text-fg-primary [font-optical-sizing:auto]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header — typographic, no icon */}
                    <div className="mb-8 border-b border-border pb-6">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">DPNDA</p>
                        <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">Deployment Calendar</h1>
                        <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Where trainees are expected to be across the month, from their weekly schedules.</p>
                    </div>
                    {/* Toolbar */}
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className={PANEL_EYEBROW}>Whereabouts</p>
                            <h2 className="font-display text-xl font-bold text-fg-primary">
                                {MONTH_NAMES[monthIndex]} {year}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => goToMonth(-1)} className={PILL_BTN} aria-label="Previous month">
                                <IconChevronLeft size={15} />
                            </button>
                            <button onClick={goToToday} className={PILL_BTN}>
                                Today
                            </button>
                            <button onClick={() => goToMonth(1)} className={PILL_BTN} aria-label="Next month">
                                <IconChevronRight size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Calendar grid */}
                        <div className="lg:col-span-2">
                            <div className={PANEL}>
                                {/* Weekday header */}
                                <div className="grid grid-cols-7 border-b border-border bg-surface-tertiary/50">
                                    {WEEKDAYS.map((d) => (
                                        <div key={d} className={`px-2 py-2.5 text-center ${MICRO_LABEL}`}>
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Day cells */}
                                <div className="grid grid-cols-7">
                                    {cells.map((cell) => {
                                        const dow = new Date(cell.date + 'T00:00:00').getDay();
                                        const entries = cell.inMonth ? entriesFor(cell.date, dow) : [];
                                        const chips = [];
                                        entries.forEach(({ placement, blocks }) => {
                                            if (blocks.length > 0) {
                                                blocks.forEach((b) => chips.push({ type: 'block', placement, block: b }));
                                            } else {
                                                chips.push({ type: 'deployed', placement });
                                            }
                                        });
                                        const visible = chips.slice(0, 3);
                                        const overflow = chips.length - visible.length;
                                        const isSelected = selectedDate === cell.date;
                                        const isToday = cell.date === todayStr;

                                        return (
                                            <button
                                                key={cell.date}
                                                type="button"
                                                disabled={!cell.inMonth}
                                                onClick={() => setSelectedDate(cell.date)}
                                                className={`flex min-h-24 flex-col items-stretch gap-1 border-b border-r border-border p-1.5 text-left align-top transition-colors last:border-r-0 ${
                                                    cell.inMonth ? 'bg-surface-secondary hover:bg-surface-tertiary/60' : 'bg-surface-tertiary/30'
                                                } ${isSelected ? 'ring-2 ring-inset ring-primary-600' : ''}`}
                                            >
                                                <span
                                                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                                                        isToday ? 'bg-primary-700 text-white' : cell.inMonth ? 'text-fg-secondary' : 'text-fg-tertiary/50'
                                                    }`}
                                                >
                                                    {cell.day}
                                                </span>
                                                {cell.inMonth && (
                                                    <span className="flex flex-col gap-1">
                                                        {visible.map((chip, i) =>
                                                            chip.type === 'block' ? (
                                                                <span
                                                                    key={i}
                                                                    title={`${chip.placement.trainee_name} · ${chip.block.location} · ${formatRange(chip.block.start_time, chip.block.end_time)}`}
                                                                    className="truncate rounded-full bg-primary-soft px-1.5 py-0.5 text-[0.625rem] font-semibold text-primary-900"
                                                                >
                                                                    {initialsFor(chip.placement.trainee_name)} {chip.block.location}
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    key={i}
                                                                    title={`${chip.placement.trainee_name} · deployed (no schedule set)`}
                                                                    className="truncate rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[0.625rem] font-medium text-fg-tertiary ring-1 ring-inset ring-border"
                                                                >
                                                                    {initialsFor(chip.placement.trainee_name)}
                                                                </span>
                                                            ),
                                                        )}
                                                        {overflow > 0 && <span className="px-1 text-[0.625rem] font-semibold text-fg-tertiary">+{overflow} more</span>}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fg-secondary">
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-3 w-3 rounded-full bg-primary-soft ring-1 ring-inset ring-primary-200" />
                                    Scheduled block (location + time)
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-3 w-3 rounded-full bg-surface-tertiary ring-1 ring-inset ring-border" />
                                    Deployed, no schedule set
                                </span>
                            </div>
                        </div>

                        {/* Day detail panel */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6">
                                <div className={PANEL}>
                                    <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-tertiary/50 px-6 py-4">
                                        <div>
                                            <p className={PANEL_EYEBROW}>Day detail</p>
                                            <h3 className="font-display text-sm font-semibold text-fg-primary">
                                                {selected
                                                    ? new Date(selected.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                                                    : 'Select a day'}
                                            </h3>
                                        </div>
                                        {selected && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDate(null)}
                                                className="grid h-8 w-8 place-items-center rounded-full text-fg-tertiary transition hover:bg-surface-tertiary hover:text-fg-primary"
                                                aria-label="Clear selection"
                                            >
                                                <IconX size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        {!selected ? (
                                            <div className="py-8 text-center">
                                                <IconMapPin size={24} className="mx-auto mb-3 text-fg-tertiary" />
                                                <p className="text-xs text-fg-tertiary">Click a day on the calendar to see who is expected where.</p>
                                            </div>
                                        ) : selected.entries.length === 0 ? (
                                            <p className="py-6 text-center text-xs text-fg-tertiary">No trainees deployed on this day.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {selected.entries.map(({ placement, blocks }) => (
                                                    <div key={placement.id} className="rounded-lg border border-border bg-surface-secondary p-4">
                                                        <div className="mb-1 flex items-center justify-between gap-2">
                                                            <p className="text-sm font-semibold text-fg-primary">{placement.trainee_name}</p>
                                                            <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[0.625rem] font-semibold text-fg-secondary ring-1 ring-inset ring-border">
                                                                {titleCase(placement.trainee_type)}
                                                            </span>
                                                        </div>
                                                        <p className="mb-2 text-xs text-fg-tertiary">
                                                            {placement.department_assigned} · {placement.enrolled_school}
                                                        </p>
                                                        {blocks.length > 0 ? (
                                                            <ul className="space-y-1.5">
                                                                {blocks.map((b) => (
                                                                    <li key={b.id} className="flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2">
                                                                        <IconClock size={14} className="mt-0.5 shrink-0 text-primary-700" strokeWidth={2} />
                                                                        <div className="min-w-0">
                                                                            <p className="text-xs font-semibold text-primary-900">
                                                                                {b.location} · {formatRange(b.start_time, b.end_time)}
                                                                            </p>
                                                                            {b.notes && <p className="mt-0.5 truncate text-[0.6875rem] text-primary-900/70">{b.notes}</p>}
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="rounded-lg bg-surface-tertiary px-3 py-2 text-xs text-fg-tertiary ring-1 ring-inset ring-border">
                                                                Deployed this day, but no schedule set.
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
