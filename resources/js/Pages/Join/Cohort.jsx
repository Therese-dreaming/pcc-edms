import { Head, useForm } from '@inertiajs/react';
import { IconUsersGroup, IconCircleX, IconClockX, IconUserOff } from '@tabler/icons-react';
import InputError from '@/Components/InputError';

// Hoisted to module scope so their function identity is stable across renders. When these lived
// inside the component body, every setData keystroke re-created them, so React unmounted/remounted
// the subtree and the focused input lost focus after a single character (concern 1 / A1).
const Shell = ({ children }) => (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4 font-sans">
        <div className="w-full max-w-lg">
            <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
                <div className="p-8">{children}</div>
            </div>
            <p className="mt-6 text-center text-xs text-stone-500">
                Pasig Catholic College — Electronic Document Management System
            </p>
        </div>
    </div>
);

const Header = ({ icon: Icon, tone = 'primary', title, subtitle }) => {
    const tones = { primary: 'bg-primary-700', amber: 'bg-amber-500', red: 'bg-red-600' };
    return (
        <div className="mb-6 text-center">
            <div className="mb-5 flex justify-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${tones[tone]} shadow-sm`}>
                    <Icon size={32} className="text-white" aria-hidden="true" />
                </div>
            </div>
            <h1 className="font-display mb-2 text-2xl font-bold text-stone-900">{title}</h1>
            {subtitle && <p className="font-subtitle text-sm leading-relaxed text-stone-600">{subtitle}</p>}
        </div>
    );
};

// Public class enrolment. The student fills this in themselves — that's the entire point, so the
// adviser doesn't transcribe 40-50 people. Standalone (no authenticated layout): no account yet.
// The server resolves `state`; every rejection is explained rather than shown as a dead end.
export default function Cohort({ code, state, cohort }) {
    const { data, setData, post, processing, errors } = useForm({
        full_name: '',
        email: '',
        student_number: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('join.cohort.store', code));
    };

    if (state === 'invalid') {
        return (
            <><Head title="Join a class" />
                <Shell>
                    <Header icon={IconCircleX} tone="red" title="Link not recognised"
                        subtitle="Check the code with your adviser — it may have been mistyped, or a new code may have been issued." />
                </Shell></>
        );
    }

    if (state === 'closed') {
        return (
            <><Head title="Enrolment closed" />
                <Shell>
                    <Header icon={IconUserOff} tone="amber" title="Enrolment closed"
                        subtitle={`${cohort?.name} is no longer accepting enrolments. Contact ${cohort?.adviser_name} if you still need access.`} />
                </Shell></>
        );
    }

    if (state === 'expired') {
        return (
            <><Head title="Link expired" />
                <Shell>
                    <Header icon={IconClockX} tone="amber" title="This link has expired"
                        subtitle={`The join code for ${cohort?.name} is past its expiry date. Ask ${cohort?.adviser_name} for a current one.`} />
                </Shell></>
        );
    }

    if (state === 'full') {
        return (
            <><Head title="Class full" />
                <Shell>
                    <Header icon={IconUserOff} tone="amber" title="This class is full"
                        subtitle={`${cohort?.name} has reached its enrolment limit. Ask ${cohort?.adviser_name} to add you directly.`} />
                </Shell></>
        );
    }

    return (
        <>
            <Head title={`Join ${cohort?.name}`} />
            <Shell>
                <Header
                    icon={IconUsersGroup}
                    title="Join your class"
                    subtitle={`You're enrolling in ${cohort?.name}, run by ${cohort?.adviser_name}. Your details create your PCC-EDMS account.`}
                />

                {cohort?.allowed_email_domains?.length > 0 && (
                    <div className="mb-5 rounded-lg border border-border bg-surface-tertiary p-3 text-xs text-fg-secondary">
                        Use your institutional email address ({cohort.allowed_email_domains.join(' or ')}).
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-stone-700">Full name</label>
                        <input
                            id="full_name" type="text" required autoComplete="name"
                            value={data.full_name}
                            onChange={(e) => setData('full_name', e.target.value)}
                            className="block w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition-colors focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                            placeholder="e.g. Ana Cruz"
                        />
                        <InputError message={errors.full_name} className="mt-2" />
                    </div>

                    <div>
                        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-700">Email address</label>
                        <input
                            id="email" type="email" required autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="block w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition-colors focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <label htmlFor="student_number" className="mb-1.5 block text-sm font-medium text-stone-700">
                            Student number <span className="font-normal text-stone-400">(optional)</span>
                        </label>
                        <input
                            id="student_number" type="text"
                            value={data.student_number}
                            onChange={(e) => setData('student_number', e.target.value)}
                            className="block w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition-colors focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                            placeholder="e.g. 2026-00123"
                        />
                        <InputError message={errors.student_number} className="mt-2" />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-700">Choose a password</label>
                        <input
                            id="password" type="password" required autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="block w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 transition-colors focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-medium text-stone-700">Confirm password</label>
                        <input
                            id="password_confirmation" type="password" required autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="block w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 transition-colors focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? 'Creating your account…' : 'Join this class'}
                    </button>

                    <p className="text-center text-xs text-stone-500">
                        We&apos;ll email you a link to confirm your address before you can submit anything.
                    </p>
                </form>
            </Shell>
        </>
    );
}
