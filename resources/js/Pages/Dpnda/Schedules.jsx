import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PageHeader from '@/Components/PageHeader';
import { confirmDanger } from '@/lib/confirm';
import { Head, router, useForm } from '@inertiajs/react';
import {
    IconCalendarTime,
    IconClock,
    IconMapPin,
    IconPencil,
    IconPlus,
    IconTrash,
    IconX,
} from '@tabler/icons-react';
import { useMemo } from 'react';

const PANEL = 'overflow-hidden rounded-xl border border-border bg-surface-secondary shadow-resting';
const PANEL_EYEBROW = 'text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700';
const MICRO_LABEL = 'text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-fg-tertiary';
const TEXT_INPUT =
    'block w-full rounded-full border border-border-medium bg-surface-secondary px-4 py-2.5 text-[0.8125rem] text-fg-primary placeholder:text-fg-tertiary shadow-sm transition focus:border-primary-600 focus:outline-none focus:ring-[3px] focus:ring-primary-600/15';
const PRIMARY_BTN =
    'inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0';
const SECONDARY_BTN =
    'inline-flex items-center gap-2 rounded-full border border-border-medium bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-fg-secondary shadow-sm transition hover:bg-surface-tertiary active:translate-y-px';

const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n) => String(n).padStart(2, '0');

// Backend `time` columns serialize as "HH:MM:SS"; <input type="time"> wants "HH:MM".
const toTimeInput = (t) => (t ? t.slice(0, 5) : '');

const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${pad(m)} ${period}`;
};

// Placement dates serialize as ISO strings; slice the date part so the browser's timezone can't
// shift the day (the app runs UTC+8, but be safe).
const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const titleCase = (value = '') =>
    value.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

export default function Schedules({ schedules = [], myPlacement }) {
    const defaultBlock = () => ({
        placement_id: myPlacement?.id ?? '',
        day_of_week: 1,
        start_time: '08:00',
        end_time: '17:00',
        location: myPlacement?.department_assigned ?? '',
        notes: '',
    });

    const { data, setData, post, put, processing, errors } = useForm(defaultBlock());
    const editingId = data.id ?? null;

    // Group the trainee's blocks by day of week (Sun..Sat) for the weekly view.
    const blocksByDay = useMemo(() => {
        const map = {};
        (schedules ?? []).forEach((s) => {
            (map[s.day_of_week] = map[s.day_of_week] ?? []).push(s);
        });
        return map;
    }, [schedules]);
    const daysWithBlocks = Object.keys(blocksByDay).map(Number).sort((a, b) => a - b);

    const todayStr = useMemo(() => {
        const t = new Date();
        return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    }, []);
    const placementActive =
        !!myPlacement &&
        myPlacement.start_date.slice(0, 10) <= todayStr &&
        myPlacement.end_date.slice(0, 10) >= todayStr;

    const startEdit = (block) =>
        setData({
            id: block.id,
            placement_id: block.placement_id,
            day_of_week: block.day_of_week,
            start_time: toTimeInput(block.start_time),
            end_time: toTimeInput(block.end_time),
            location: block.location,
            notes: block.notes ?? '',
        });

    const cancelEdit = () => setData(defaultBlock());

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('dpnda.schedules.update', editingId), {
                preserveScroll: true,
                onSuccess: () => setData(defaultBlock()),
            });
        } else {
            post(route('dpnda.schedules.store'), {
                preserveScroll: true,
                onSuccess: () => setData(defaultBlock()),
            });
        }
    };

    const removeBlock = async (block) => {
        const ok = await confirmDanger({
            title: 'Remove this schedule block?',
            text: `${WEEKDAYS_FULL[block.day_of_week]} · ${block.location} (${formatTime(block.start_time)} – ${formatTime(
                block.end_time,
            )}) will be removed from your weekly schedule.`,
            confirmText: 'Remove',
        });
        if (!ok) return;
        router.delete(route('dpnda.schedules.destroy', block.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconCalendarTime}
                    title="My Schedule"
                    description="Set your weekly whereabouts for your deployment — the days, times, and places you'll be at."
                />
            }
        >
            <Head title="My Schedule" />

            <div className="py-8 font-sans text-fg-primary [font-optical-sizing:auto]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {!myPlacement ? (
                        /* No placement yet — the coordinator creates it via Form 5. */
                        <div className={`${PANEL} p-12 text-center`}>
                            <IconCalendarTime size={32} className="mx-auto mb-4 text-fg-tertiary" />
                            <h3 className="font-display text-base font-semibold text-fg-primary">No deployment yet</h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-fg-tertiary">
                                Your coordinator hasn't created your placement (Form 5) yet. Once they do, you'll be able
                                to set your weekly schedule here.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Deployment context */}
                            <div className={`${PANEL} mb-6`}>
                                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                                    <div>
                                        <p className={PANEL_EYEBROW}>Your deployment</p>
                                        <h3 className="font-display text-lg font-bold text-fg-primary">
                                            {myPlacement.department_assigned}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-fg-tertiary">
                                            {myPlacement.enrolled_school} · {titleCase(myPlacement.trainee_type)}
                                            {myPlacement.pcc_supervisor ? ` · Supervisor: ${myPlacement.pcc_supervisor}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary px-3 py-1.5 text-xs font-semibold text-fg-secondary ring-1 ring-inset ring-border">
                                            <IconClock size={14} className="text-fg-tertiary" />
                                            {formatDate(myPlacement.start_date)} – {formatDate(myPlacement.end_date)}
                                        </span>
                                        <span
                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                                                placementActive
                                                    ? 'bg-success-bg text-success-text ring-success/30'
                                                    : 'bg-surface-tertiary text-fg-tertiary ring-border'
                                            }`}
                                        >
                                            {placementActive ? 'Active' : 'Not currently active'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                {/* Weekly blocks, grouped by day */}
                                <div className="lg:col-span-2">
                                    <div className={PANEL}>
                                        <div className="border-b border-border bg-surface-tertiary/50 px-6 py-4">
                                            <p className={PANEL_EYEBROW}>Weekly whereabouts</p>
                                            <h3 className="font-display text-sm font-semibold text-fg-primary">
                                                {daysWithBlocks.length > 0
                                                    ? `${schedules.length} block${schedules.length > 1 ? 's' : ''} across ${daysWithBlocks.length} day${
                                                          daysWithBlocks.length > 1 ? 's' : ''
                                                      }`
                                                    : 'No schedule set yet'}
                                            </h3>
                                        </div>

                                        <div className="p-6">
                                            {daysWithBlocks.length === 0 ? (
                                                <div className="py-10 text-center">
                                                    <IconMapPin size={24} className="mx-auto mb-3 text-fg-tertiary" />
                                                    <p className="text-sm text-fg-tertiary">
                                                        Add your first block using the form — e.g. "Mondays, 8:00 AM – 5:00
                                                        PM, Records Office".
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {daysWithBlocks.map((day) => (
                                                        <div key={day}>
                                                            <p className={`mb-2 ${MICRO_LABEL}`}>{WEEKDAYS_FULL[day]}</p>
                                                            <ul className="space-y-2">
                                                                {blocksByDay[day].map((block) => (
                                                                    <li
                                                                        key={block.id}
                                                                        className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-secondary px-4 py-3"
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-fg-primary">
                                                                                <IconMapPin size={15} className="text-primary-700" strokeWidth={2} />
                                                                                {block.location}
                                                                            </p>
                                                                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-tertiary">
                                                                                <IconClock size={13} />
                                                                                {formatTime(block.start_time)} – {formatTime(block.end_time)}
                                                                            </p>
                                                                            {block.notes && (
                                                                                <p className="mt-1 text-xs text-fg-tertiary">{block.notes}</p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => startEdit(block)}
                                                                                className="grid h-8 w-8 place-items-center rounded-full text-fg-tertiary transition hover:bg-surface-tertiary hover:text-primary"
                                                                                aria-label={`Edit ${block.location}`}
                                                                            >
                                                                                <IconPencil size={15} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeBlock(block)}
                                                                                className="grid h-8 w-8 place-items-center rounded-full text-fg-tertiary transition hover:bg-danger-bg hover:text-danger-text"
                                                                                aria-label={`Remove ${block.location}`}
                                                                            >
                                                                                <IconTrash size={15} />
                                                                            </button>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Add / edit block form */}
                                <div className="lg:col-span-1">
                                    <div className="sticky top-6">
                                        <form onSubmit={submit} className={PANEL}>
                                            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-tertiary/50 px-6 py-4">
                                                <div>
                                                    <p className={PANEL_EYEBROW}>{editingId ? 'Edit block' : 'Add a block'}</p>
                                                    <h3 className="font-display text-sm font-semibold text-fg-primary">
                                                        {editingId ? 'Update this weekly block' : 'Where will you be?'}
                                                    </h3>
                                                </div>
                                                {editingId && (
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="grid h-8 w-8 place-items-center rounded-full text-fg-tertiary transition hover:bg-surface-tertiary hover:text-fg-primary"
                                                        aria-label="Cancel editing"
                                                    >
                                                        <IconX size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-4 p-6">
                                                <div>
                                                    <label htmlFor="day_of_week" className={`mb-1.5 block ${MICRO_LABEL}`}>
                                                        Day of week
                                                    </label>
                                                    <select
                                                        id="day_of_week"
                                                        className={TEXT_INPUT}
                                                        value={data.day_of_week}
                                                        onChange={(e) => setData('day_of_week', Number(e.target.value))}
                                                    >
                                                        {WEEKDAYS_FULL.map((label, value) => (
                                                            <option key={label} value={value}>
                                                                {label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <InputError message={errors.day_of_week} className="mt-2" />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label htmlFor="start_time" className={`mb-1.5 block ${MICRO_LABEL}`}>
                                                            Start
                                                        </label>
                                                        <input
                                                            id="start_time"
                                                            type="time"
                                                            className={TEXT_INPUT}
                                                            value={data.start_time}
                                                            onChange={(e) => setData('start_time', e.target.value)}
                                                        />
                                                        <InputError message={errors.start_time} className="mt-2" />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="end_time" className={`mb-1.5 block ${MICRO_LABEL}`}>
                                                            End
                                                        </label>
                                                        <input
                                                            id="end_time"
                                                            type="time"
                                                            className={TEXT_INPUT}
                                                            value={data.end_time}
                                                            onChange={(e) => setData('end_time', e.target.value)}
                                                        />
                                                        <InputError message={errors.end_time} className="mt-2" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label htmlFor="location" className={`mb-1.5 block ${MICRO_LABEL}`}>
                                                        Location / office
                                                    </label>
                                                    <input
                                                        id="location"
                                                        type="text"
                                                        className={TEXT_INPUT}
                                                        value={data.location}
                                                        onChange={(e) => setData('location', e.target.value)}
                                                        placeholder="e.g. Records Office"
                                                    />
                                                    <InputError message={errors.location} className="mt-2" />
                                                </div>

                                                <div>
                                                    <label htmlFor="notes" className={`mb-1.5 block ${MICRO_LABEL}`}>
                                                        Notes <span className="normal-case text-fg-tertiary">(optional)</span>
                                                    </label>
                                                    <input
                                                        id="notes"
                                                        type="text"
                                                        className={TEXT_INPUT}
                                                        value={data.notes}
                                                        onChange={(e) => setData('notes', e.target.value)}
                                                        placeholder="e.g. Assist with encoding"
                                                    />
                                                    <InputError message={errors.notes} className="mt-2" />
                                                </div>

                                                <div className="flex items-center gap-2 pt-1">
                                                    <button type="submit" disabled={processing} className={PRIMARY_BTN}>
                                                        {editingId ? 'Save changes' : (
                                                            <>
                                                                <IconPlus size={16} strokeWidth={2} />
                                                                Add block
                                                            </>
                                                        )}
                                                    </button>
                                                    {editingId && (
                                                        <button type="button" onClick={cancelEdit} className={SECONDARY_BTN}>
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
