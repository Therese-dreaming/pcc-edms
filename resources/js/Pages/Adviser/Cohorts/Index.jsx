import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Table, THead, TBody, Tr, Th, Td, EmptyRow } from '@/Components/Table';
import { Head, Link } from '@inertiajs/react';
import { IconUsersGroup, IconPlus, IconCircleCheck } from '@tabler/icons-react';

// Adviser's classes. Each cohort is onboarded with one shared join code instead of typing every
// student into the single-applicant form.
export default function Index({ cohorts, status }) {
    const stateLabel = (c) => {
        if (!c.is_open) return { text: 'Closed', cls: 'bg-zinc-100 text-zinc-600' };
        if (c.is_expired) return { text: 'Expired', cls: 'bg-amber-100 text-amber-800' };
        return { text: 'Open', cls: 'bg-emerald-100 text-emerald-800' };
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconUsersGroup}
                    title="Classes"
                    description="Onboard a whole class with one join code — students enrol themselves."
                />
            }
        >
            <Head title="Classes" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {status && (
                        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                            <IconCircleCheck size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                            <p>{status}</p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Link
                            href={route('adviser.cohorts.create')}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800"
                        >
                            <IconPlus size={16} strokeWidth={2.5} />
                            New class
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <Table ariaLabel="Classes">
                            <THead>
                                <Tr>
                                    <Th>Class</Th>
                                    <Th>Join code</Th>
                                    <Th>Enrolled</Th>
                                    <Th>Pending invites</Th>
                                    <Th>Expires</Th>
                                    <Th>State</Th>
                                    <Th className="text-right">Actions</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {cohorts.length === 0 && (
                                    <EmptyRow colSpan={7}>
                                        No classes yet. Create one and share its join code with your students.
                                    </EmptyRow>
                                )}
                                {cohorts.map((c) => {
                                    const state = stateLabel(c);
                                    return (
                                        <Tr key={c.id}>
                                            <Td>
                                                <Link
                                                    href={route('adviser.cohorts.show', c.id)}
                                                    className="font-medium text-primary-700 hover:underline"
                                                >
                                                    {c.name}
                                                </Link>
                                                <div className="text-xs text-zinc-500">
                                                    {[c.course, c.level, c.section].filter(Boolean).join(' · ') || c.department || '—'}
                                                </div>
                                            </Td>
                                            <Td><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs tracking-wider">{c.join_code}</code></Td>
                                            <Td className="tabular-nums">
                                                {c.joined_count}{c.max_members ? ` / ${c.max_members}` : ''}
                                            </Td>
                                            <Td className="tabular-nums">{c.invited_count || '—'}</Td>
                                            <Td>{c.expires_at || 'No expiry'}</Td>
                                            <Td>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${state.cls}`}>
                                                    {state.text}
                                                </span>
                                            </Td>
                                            <Td className="text-right">
                                                <Link
                                                    href={route('adviser.cohorts.edit', c.id)}
                                                    className="text-xs font-semibold text-primary-700 hover:underline"
                                                >
                                                    Edit
                                                </Link>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </TBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
