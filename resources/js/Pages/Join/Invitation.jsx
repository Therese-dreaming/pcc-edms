import { Head, Link, useForm } from '@inertiajs/react';
import { IconUserPlus, IconCircleX, IconClockX, IconCircleCheck } from '@tabler/icons-react';
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
    const tones = { primary: 'bg-primary-700', amber: 'bg-amber-500', red: 'bg-red-600', green: 'bg-emerald-600' };
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

const SignInLink = () => (
    <p className="mt-5 text-center text-sm">
        <Link href={route('login')} className="font-semibold text-primary-700 hover:underline">Go to sign in</Link>
    </p>
);

// The adviser manual-add fallback, from the student's side: a personal single-use link that lets
// them finish setting up the account their adviser started. Email is fixed (the adviser supplied
// it and the token is bound to it); the student fills in the rest.
export default function Invitation({ token, state, member, cohort }) {
    const { data, setData, post, processing, errors } = useForm({
        full_name: member?.full_name ?? '',
        student_number: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('join.invitation.accept', token));
    };

    // A consumed token is deleted, so an already-used link lands here rather than on 'used' — the
    // copy covers both readings so a student clicking an old email isn't left confused.
    if (state === 'invalid') {
        return (
            <><Head title="Invitation" />
                <Shell>
                    <Header icon={IconCircleX} tone="red" title="This link isn't valid"
                        subtitle="It may already have been used, or a newer invitation may have replaced it. If you've already set up your account, just sign in." />
                    <SignInLink />
                </Shell></>
        );
    }

    if (state === 'used') {
        return (
            <><Head title="Already set up" />
                <Shell>
                    <Header icon={IconCircleCheck} tone="green" title="Account already set up"
                        subtitle="You've already completed this invitation. Sign in with the password you chose." />
                    <SignInLink />
                </Shell></>
        );
    }

    if (state === 'revoked') {
        return (
            <><Head title="Invitation withdrawn" />
                <Shell>
                    <Header icon={IconCircleX} tone="amber" title="Invitation withdrawn"
                        subtitle={`You were removed from ${cohort?.name}. Contact ${cohort?.adviser_name} if this is unexpected.`} />
                </Shell></>
        );
    }

    if (state === 'expired') {
        return (
            <><Head title="Invitation expired" />
                <Shell>
                    <Header icon={IconClockX} tone="amber" title="This invitation has expired"
                        subtitle={`Ask ${cohort?.adviser_name} to resend your invitation for ${cohort?.name}.`} />
                </Shell></>
        );
    }

    return (
        <>
            <Head title="Set up your account" />
            <Shell>
                <Header
                    icon={IconUserPlus}
                    title="Set up your account"
                    subtitle={`${cohort?.adviser_name} added you to ${cohort?.name}. Choose a password to finish.`}
                />

                <div className="mb-5 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">
                    <span className="font-medium text-stone-500">Email: </span>
                    <span className="text-stone-800">{member?.email}</span>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-stone-700">Full name</label>
                        <input
                            id="full_name" type="text" required autoComplete="name"
                            value={data.full_name}
                            onChange={(e) => setData('full_name', e.target.value)}
                            className="block w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 transition-colors focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                        />
                        <InputError message={errors.full_name} className="mt-2" />
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
                        {processing ? 'Setting up…' : 'Set up my account'}
                    </button>

                    <p className="text-center text-xs text-stone-500">
                        We&apos;ll email you a link to confirm your address before you can submit anything.
                    </p>
                </form>
            </Shell>
        </>
    );
}
