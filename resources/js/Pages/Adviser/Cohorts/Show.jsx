import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PageHeader from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import { Table, THead, TBody, Tr, Th, Td, EmptyRow } from '@/Components/Table';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    IconUsersGroup, IconCopy, IconCheck, IconRefresh, IconLock, IconLockOpen,
    IconCircleCheck, IconSend, IconTrash, IconPencil,
} from '@tabler/icons-react';
import { useState } from 'react';

// The screen that replaces typing 40-50 students by hand: share the code/link/QR, watch the roster
// fill itself, and use the manual add fallback only for students who can't self-enrol.
export default function Show({ cohort, joinUrl, joinQr, members, status }) {
    const [copied, setCopied] = useState(null);

    const memberForm = useForm({ full_name: '', email: '' });
    const bulkForm = useForm({ rows: '' });

    const copy = (text, which) => {
        navigator.clipboard?.writeText(text).then(() => {
            setCopied(which);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    const joined = members.filter((m) => m.status === 'joined');
    const invited = members.filter((m) => m.status === 'invited');

    const statusPill = (m) => {
        if (m.status === 'joined') {
            return m.account_verified
                ? { text: 'Enrolled', cls: 'bg-emerald-100 text-emerald-800' }
                : { text: 'Enrolled · email unverified', cls: 'bg-warning-bg text-warning-text' };
        }
        if (m.status === 'removed') return { text: 'Removed', cls: 'bg-zinc-100 text-zinc-500' };
        if (m.invitation_expired) return { text: 'Invite expired', cls: 'bg-amber-100 text-amber-800' };
        return { text: 'Invited', cls: 'bg-amber-100 text-amber-800' };
    };

    const cohortState = !cohort.is_open
        ? { text: 'Closed', cls: 'bg-zinc-100 text-zinc-600' }
        : cohort.is_expired
            ? { text: 'Expired', cls: 'bg-amber-100 text-amber-800' }
            : cohort.is_full
                ? { text: 'Full', cls: 'bg-amber-100 text-amber-800' }
                : { text: 'Open for enrolment', cls: 'bg-emerald-100 text-emerald-800' };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconUsersGroup}
                    title={cohort.name}
                    description={[cohort.course, cohort.level, cohort.section, cohort.department].filter(Boolean).join(' · ')}
                />
            }
        >
            <Head title={cohort.name} />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {status && (
                        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                            <IconCircleCheck size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                            <p>{status}</p>
                        </div>
                    )}

                    {/* Share panel — the primary path */}
                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
                            <div className="min-w-0 flex-1">
                                <div className="mb-3 flex items-center gap-2">
                                    <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-zinc-600">
                                        Share to enrol
                                    </h2>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cohortState.cls}`}>
                                        {cohortState.text}
                                    </span>
                                </div>

                                <p className="mb-4 text-sm text-zinc-600">
                                    Students enter this code (or scan the QR) and fill in their own details — you don&apos;t
                                    have to type anyone in.
                                </p>

                                <div className="mb-3">
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Join code</p>
                                    <div className="flex items-center gap-2">
                                        <code className="rounded-lg bg-zinc-900 px-4 py-2.5 font-mono text-2xl font-bold tracking-[0.2em] text-white">
                                            {cohort.join_code}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => copy(cohort.join_code, 'code')}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                        >
                                            {copied === 'code' ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                            {copied === 'code' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Join link</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={joinUrl}
                                            onFocus={(e) => e.target.select()}
                                            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => copy(joinUrl, 'link')}
                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                        >
                                            {copied === 'link' ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                            {copied === 'link' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs">
                                    <Link
                                        href={route('adviser.cohorts.edit', cohort.id)}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
                                    >
                                        <IconPencil size={14} />
                                        Edit class
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => router.post(route('adviser.cohorts.toggle-open', cohort.id), {}, { preserveScroll: true })}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
                                    >
                                        {cohort.is_open ? <IconLock size={14} /> : <IconLockOpen size={14} />}
                                        {cohort.is_open ? 'Close enrolment' : 'Reopen enrolment'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('Generate a new join code? Any link or code you already shared will stop working.')) {
                                                router.post(route('adviser.cohorts.regenerate-code', cohort.id), {}, { preserveScroll: true });
                                            }
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
                                    >
                                        <IconRefresh size={14} />
                                        New code
                                    </button>
                                </div>

                                <dl className="mt-4 space-y-1 text-xs text-zinc-500">
                                    <div><dt className="inline font-medium">Enrolled: </dt><dd className="inline tabular-nums">{joined.length}{cohort.max_members ? ` of ${cohort.max_members}` : ''}</dd></div>
                                    {cohort.expires_at && <div><dt className="inline font-medium">Code expires: </dt><dd className="inline">{cohort.expires_at}</dd></div>}
                                    {cohort.allowed_email_domains?.length > 0 && (
                                        <div><dt className="inline font-medium">Allowed domains: </dt><dd className="inline">{cohort.allowed_email_domains.join(', ')}</dd></div>
                                    )}
                                </dl>
                            </div>

                            {/* QR for projecting in class — reuses the certificate QR helper */}
                            <div className="shrink-0 text-center">
                                <img src={joinQr} alt="QR code to join this class" className="h-40 w-40 rounded-lg border border-zinc-200 bg-white p-2" />
                                <p className="mt-2 text-xs text-zinc-500">Scan to join</p>
                            </div>
                        </div>
                    </div>

                    {/* Roster */}
                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
                            <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-zinc-600">
                                Roster — {joined.length} enrolled{invited.length > 0 ? `, ${invited.length} invited` : ''}
                            </h3>
                        </div>

                        <Table ariaLabel="Class roster">
                            <THead>
                                <Tr>
                                    <Th>Student</Th>
                                    <Th>Email</Th>
                                    <Th>Student no.</Th>
                                    <Th>Status</Th>
                                    <Th className="text-right">Actions</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {members.length === 0 && (
                                    <EmptyRow colSpan={5}>
                                        Nobody has enrolled yet. Share the join code above, or add a student manually below.
                                    </EmptyRow>
                                )}
                                {members.map((m) => {
                                    const pill = statusPill(m);
                                    return (
                                        <Tr key={m.id} className={m.status === 'removed' ? 'opacity-50' : ''}>
                                            <Td className="font-medium text-zinc-900">{m.full_name}</Td>
                                            <Td className="text-zinc-600">{m.email}</Td>
                                            <Td className="tabular-nums text-zinc-600">{m.student_number || '—'}</Td>
                                            <Td>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pill.cls}`}>
                                                    {pill.text}
                                                </span>
                                            </Td>
                                            <Td className="text-right">
                                                {m.status !== 'removed' && (
                                                    <div className="flex justify-end gap-2">
                                                        {m.status === 'invited' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => router.post(route('adviser.cohorts.members.resend', [cohort.id, m.id]), {}, { preserveScroll: true })}
                                                                className="inline-flex items-center gap-1 rounded-md border border-primary-300 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
                                                                title="Resend invitation"
                                                            >
                                                                <IconSend size={13} /> Resend
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (confirm(`Remove ${m.full_name} from this class? Any account they already created is kept.`)) {
                                                                    router.delete(route('adviser.cohorts.members.remove', [cohort.id, m.id]), { preserveScroll: true });
                                                                }
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                                                        >
                                                            <IconTrash size={13} /> Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </TBody>
                        </Table>
                    </div>

                    {/* Fallback: adviser adds students who can't self-enrol */}
                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
                            <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-zinc-600">
                                Add students manually
                            </h3>
                            <p className="mt-1 text-xs text-zinc-500">
                                Only needed for students who can&apos;t use the join code. Each one gets a personal
                                setup link by email — no account is created until they accept.
                            </p>
                        </div>

                        <div className="grid gap-6 p-6 md:grid-cols-2">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    memberForm.post(route('adviser.cohorts.members.add', cohort.id), {
                                        preserveScroll: true,
                                        onSuccess: () => memberForm.reset(),
                                    });
                                }}
                                className="space-y-2"
                            >
                                <p className="text-xs font-medium text-zinc-700">One student</p>
                                <TextInput
                                    className="w-full text-sm"
                                    placeholder="Full name"
                                    value={memberForm.data.full_name}
                                    onChange={(e) => memberForm.setData('full_name', e.target.value)}
                                />
                                <TextInput
                                    type="email"
                                    className="w-full text-sm"
                                    placeholder="Email address"
                                    value={memberForm.data.email}
                                    onChange={(e) => memberForm.setData('email', e.target.value)}
                                />
                                <InputError message={memberForm.errors.full_name} />
                                <InputError message={memberForm.errors.email} />
                                <button
                                    type="submit"
                                    disabled={memberForm.processing || !memberForm.data.full_name || !memberForm.data.email}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {memberForm.processing ? 'Sending…' : 'Send invitation'}
                                </button>
                            </form>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    bulkForm.post(route('adviser.cohorts.members.bulk', cohort.id), {
                                        preserveScroll: true,
                                        onSuccess: () => bulkForm.reset(),
                                    });
                                }}
                                className="space-y-2"
                            >
                                <p className="text-xs font-medium text-zinc-700">Paste a list</p>
                                <textarea
                                    rows={5}
                                    className="w-full rounded-md border-zinc-300 text-sm shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                                    placeholder={'Ana Cruz, ana.cruz@pcc.edu.ph\nBen Reyes, ben.reyes@pcc.edu.ph'}
                                    value={bulkForm.data.rows}
                                    onChange={(e) => bulkForm.setData('rows', e.target.value)}
                                />
                                <p className="text-xs text-zinc-500">
                                    One student per line — paste straight from a spreadsheet. Comma, tab or semicolon
                                    between name and email.
                                </p>
                                <InputError message={bulkForm.errors.rows} />
                                <button
                                    type="submit"
                                    disabled={bulkForm.processing || !bulkForm.data.rows.trim()}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {bulkForm.processing ? 'Sending…' : 'Send invitations'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <Link href={route('adviser.cohorts.index')} className="inline-block text-sm text-primary-700 hover:underline">
                        ← Back to classes
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
