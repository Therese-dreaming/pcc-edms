import { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    IconAlertTriangle,
    IconArrowRight,
    IconBook2,
    IconBriefcase2,
    IconDatabase,
    IconEye,
    IconEyeOff,
    IconFileDescription,
    IconLoader2,
    IconLock,
    IconMail,
    IconScale,
    IconShieldCheck,
    IconUserCheck,
} from '@tabler/icons-react';
import { notifyResultError, notifySuccess } from '@/lib/confirm';

const policySections = [
    {
        number: '01',
        title: 'Authorized use',
        icon: IconUserCheck,
        body: 'Use this system only for official Pasig Catholic College OJT, research, Data Protection Office, and Ethics Review activities. Access is personal and role-based. Never share accounts, passwords, one-time codes, or restricted records.',
    },
    {
        number: '02',
        title: 'Document accuracy',
        icon: IconFileDescription,
        body: 'Submit complete, accurate, and authentic information. You are responsible for checking names, dates, endorsements, consent records, and attachments before submission. Misrepresentation or altered documents may be referred for institutional review.',
    },
    {
        number: '03',
        title: 'Privacy and confidentiality',
        icon: IconShieldCheck,
        body: 'Handle personal, academic, company, research participant, and sensitive information only for its approved purpose. Do not download, copy, photograph, publish, or disclose records unless your role and the applicable process expressly allow it.',
    },
    {
        number: '04',
        title: 'Research, DPO, and Ethics review',
        icon: IconScale,
        body: 'System submission does not by itself grant approval. Research involving personal data or human participants may proceed only after all required institutional, Data Protection Office, and Ethics approvals are issued and any stated conditions are satisfied.',
    },
    {
        number: '05',
        title: 'OJT records',
        icon: IconBriefcase2,
        body: 'OJT applications, agreements, endorsements, evaluations, and related company records must be used only for placement, supervision, assessment, compliance, and authorized reporting. Company-confidential material must be clearly identified and protected.',
    },
    {
        number: '06',
        title: 'Retention and audit trail',
        icon: IconDatabase,
        body: 'Documents, approvals, comments, timestamps, and access events may be retained according to institutional schedules and legal obligations. The system may log activity to preserve record integrity, investigate incidents, and support audits.',
    },
    {
        number: '07',
        title: 'Security incidents',
        icon: IconAlertTriangle,
        body: 'Report suspected unauthorized access, accidental disclosure, lost credentials, malware, or incorrect recipient access immediately through the official PCC support or Data Protection Office channel. Do not conceal, delete, or independently investigate evidence.',
    },
];

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (status) notifySuccess(status);
    }, [status]);

    const submit = (event) => {
        event.preventDefault();

        post(route('login'), {
            onError: () =>
                notifyResultError(
                    'Sign-in failed',
                    'Check your email and password, then try again.',
                ),
            onFinish: () => reset('password'),
        });
    };

    const inputClass = (error) => `
        block h-[52px] w-full rounded-[10px] border bg-paper-50 py-3 pl-12 pr-12
        text-paper-900 placeholder:text-paper-400
        transition-[background-color,border-color,box-shadow] duration-150
        focus:bg-white focus:outline-none
        ${
            error
                ? 'border-danger/50 focus:border-danger focus:ring-4 focus:ring-danger/10'
                : 'border-paper-200 hover:border-paper-300 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10'
        }
    `;

    return (
        <>
            <Head title="Log in" />

            <main className="grid h-screen overflow-hidden bg-paper-50 font-sans text-paper-900 lg:grid-cols-[minmax(430px,40%)_1fr]">
                <section
                    className="grid h-screen grid-rows-[auto_1fr_auto] overflow-y-auto bg-paper-50 px-5 py-6 sm:px-10 lg:overflow-hidden lg:px-12 lg:py-9 xl:px-[clamp(52px,5vw,76px)]"
                    aria-labelledby="login-title"
                >
                    <Link
                        href="/"
                        className="flex w-fit items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20"
                    >
                        <img
                            src="/images/logo-small.png"
                            alt="PCC Logo"
                            className="h-11 w-11 object-contain"
                        />
                        <span className="grid gap-0.5">
                            <strong className="font-display text-[17px] font-bold tracking-tight">
                                Pasig Catholic College
                            </strong>
                            <span className="font-subtitle text-[11px] font-bold uppercase tracking-[0.09em] text-paper-500">
                                Electronic Document Management System
                            </span>
                        </span>
                    </Link>

                    <p className="mt-6 border-t border-paper-200 pt-4 font-subtitle text-sm font-semibold text-paper-600 lg:hidden">
                        For Research and On-the-Job Training
                    </p>

                    <div className="flex items-center py-12">
                        <div className="mx-auto w-full max-w-[430px]">
                            <p className="mb-3 font-subtitle text-xs font-bold uppercase tracking-[0.11em] text-primary-700">
                                Secure access
                            </p>
                            <h1
                                id="login-title"
                                className="font-display text-[40px] font-extrabold leading-none tracking-[-0.045em] sm:text-5xl"
                            >
                                Welcome back
                            </h1>
                            <p className="mb-8 mt-4 max-w-[38ch] font-subtitle text-base leading-relaxed text-paper-600">
                                Sign in to manage institutional documents, workflows, and approvals.
                            </p>

                            <form onSubmit={submit} className="grid gap-5">
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="email"
                                        className="font-subtitle text-[13px] font-bold text-paper-800"
                                    >
                                        Email address
                                    </label>
                                    <div className="group relative">
                                        <IconMail
                                            size={19}
                                            aria-hidden="true"
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper-400 group-focus-within:text-primary-700"
                                        />
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            autoComplete="username"
                                            autoFocus
                                            required
                                            onChange={(event) =>
                                                setData('email', event.target.value)
                                            }
                                            className={inputClass(errors.email)}
                                            placeholder="you@pcc.edu.ph"
                                            aria-invalid={Boolean(errors.email)}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="font-subtitle text-sm text-danger-text">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <label
                                            htmlFor="password"
                                            className="font-subtitle text-[13px] font-bold text-paper-800"
                                        >
                                            Password
                                        </label>
                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="font-subtitle text-[13px] font-bold text-primary-700 underline-offset-4 hover:underline"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>

                                    <div className="group relative">
                                        <IconLock
                                            size={19}
                                            aria-hidden="true"
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper-400 group-focus-within:text-primary-700"
                                        />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            autoComplete="current-password"
                                            required
                                            onChange={(event) =>
                                                setData('password', event.target.value)
                                            }
                                            className={inputClass(errors.password)}
                                            placeholder="Enter your password"
                                            aria-invalid={Boolean(errors.password)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((value) => !value)
                                            }
                                            className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-lg text-paper-400 hover:bg-paper-100 hover:text-paper-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20"
                                            aria-label={
                                                showPassword
                                                    ? 'Hide password'
                                                    : 'Show password'
                                            }
                                        >
                                            {showPassword ? (
                                                <IconEyeOff size={19} />
                                            ) : (
                                                <IconEye size={19} />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="font-subtitle text-sm text-danger-text">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <label
                                    htmlFor="remember"
                                    className="flex min-h-11 cursor-pointer items-center gap-2.5 font-subtitle text-sm font-medium text-paper-600"
                                >
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(event) =>
                                            setData('remember', event.target.checked)
                                        }
                                        className="h-[17px] w-[17px] rounded border-paper-300 text-primary-800 focus:ring-primary-700"
                                    />
                                    Keep me signed in
                                </label>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group flex h-[54px] items-center justify-center gap-2.5 rounded-[10px] bg-primary-800 px-6 font-subtitle font-bold text-white shadow-lg shadow-primary-900/20 transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-primary-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/25 disabled:cursor-wait disabled:opacity-70"
                                >
                                    {processing ? (
                                        <>
                                            <span>Signing in</span>
                                            <IconLoader2
                                                size={18}
                                                className="animate-spin"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign in to EDMS</span>
                                            <IconArrowRight
                                                size={18}
                                                stroke={2.5}
                                                className="transition-transform group-hover:translate-x-1"
                                            />
                                        </>
                                    )}
                                </button>

                                <p className="text-center font-subtitle text-sm text-paper-600">
                                    Accounts are created by your research adviser or a system
                                    administrator. Contact them if you don&apos;t have one yet.
                                </p>
                                <p className="text-center font-subtitle text-sm text-paper-600">
                                    Are you an external adviser?{' '}
                                    <Link
                                        href={route('adviser-request.create')}
                                        className="font-bold text-primary-700 underline-offset-4 hover:underline"
                                    >
                                        Request an adviser account
                                    </Link>
                                </p>
                            </form>
                        </div>
                    </div>

                    <p className="flex items-center gap-2 font-subtitle text-xs text-paper-500">
                        <IconShieldCheck size={15} aria-hidden="true" />
                        Encrypted connection. Never share your password or one-time codes.
                    </p>
                </section>

                <aside
                    className="relative hidden h-screen overflow-y-auto bg-primary-900 text-white lg:block"
                    aria-labelledby="policy-title"
                >
                    <div
                        className="pointer-events-none fixed inset-y-0 right-0 -z-0 hidden w-[60%] lg:block"
                        aria-hidden="true"
                        style={{
                            background:
                                'radial-gradient(circle at 88% 8%, oklch(44% 0.13 24), transparent 32%), radial-gradient(circle at 12% 96%, oklch(18% 0.07 8), transparent 42%), linear-gradient(145deg, oklch(40% 0.13 18), oklch(22% 0.085 18))',
                        }}
                    />

                    <div
                        className="pointer-events-none fixed inset-y-0 right-0 z-0 hidden w-[60%] place-items-center lg:grid"
                        aria-hidden="true"
                    >
                        <img
                            src="/images/logo-small.png"
                            alt=""
                            className="h-[min(64vw,820px)] w-[min(64vw,820px)] object-contain opacity-[0.055] grayscale brightness-[2.1] contrast-75"
                        />
                    </div>

                    <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[880px] flex-col px-[clamp(40px,5vw,76px)] pb-16 pt-9">
                        <header className="flex items-center justify-between gap-6 border-b border-white/15 pb-6">
                            <div className="flex items-center gap-3">
                                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-400 text-primary-950">
                                    <IconShieldCheck size={21} stroke={2.2} />
                                </span>
                                <div>
                                    <p className="font-subtitle text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">
                                        PCC EDMS
                                    </p>
                                    <p className="font-display text-base font-bold">
                                        Responsible use notice
                                    </p>
                                </div>
                            </div>

                            <nav
                                className="flex items-center gap-1"
                                aria-label="Account navigation"
                            >
                                <Link
                                    href={route('about')}
                                    className="flex min-h-11 items-center rounded-lg px-4 font-subtitle text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                                >
                                    About
                                </Link>
                                <Link
                                    href={route('verify')}
                                    className="flex min-h-11 items-center rounded-lg border border-white/20 px-4 font-subtitle text-sm font-bold text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                                >
                                    Verify a clearance
                                </Link>
                            </nav>
                        </header>

                        <div className="pt-14">
                            <p className="font-subtitle text-xs font-bold uppercase tracking-[0.12em] text-accent-400">
                                Terms and data policy
                            </p>
                            <h2
                                id="policy-title"
                                className="mt-4 max-w-[16ch] font-display text-[clamp(40px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.05em]"
                            >
                                Protect the record. Respect the people in it.
                            </h2>
                            <p className="mt-6 max-w-[66ch] font-subtitle text-base font-medium leading-7 tracking-[0.01em] text-white/72">
                                By signing in, you agree to use PCC EDMS only for authorized academic and institutional work, and to follow applicable school policies and data protection requirements.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-2" aria-label="Covered workflows">
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-primary-950/30 px-3 py-2 font-subtitle text-xs font-bold text-white/85">
                                    <IconBriefcase2 size={14} className="text-accent-400" />
                                    OJT applications
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-primary-950/30 px-3 py-2 font-subtitle text-xs font-bold text-white/85">
                                    <IconBook2 size={14} className="text-accent-400" />
                                    Research applications
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-primary-950/30 px-3 py-2 font-subtitle text-xs font-bold text-white/85">
                                    <IconShieldCheck size={14} className="text-accent-400" />
                                    DPO and Ethics review
                                </span>
                            </div>

                            {/* The compliance notice below serves as the Privacy Policy, Terms &
                                Conditions, Data Privacy Notice, and Consent Statement shown before
                                sign-in (stakeholder-additional-features.md #4, 2026-07-25). */}
                            <div className="mt-4 flex flex-wrap gap-2" aria-label="Policy documents included in this notice">
                                {['Privacy Policy', 'Terms & Conditions', 'Data Privacy Notice', 'Consent Statement'].map((doc) => (
                                    <span
                                        key={doc}
                                        className="inline-flex items-center rounded-full border border-white/12 px-3 py-1.5 font-subtitle text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-white/60"
                                    >
                                        {doc}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-14 border-t border-white/15">
                            {policySections.map(({ number, title, icon: Icon, body }) => (
                                <section
                                    key={number}
                                    className="grid grid-cols-[44px_1fr] gap-5 border-b border-white/15 py-7 sm:grid-cols-[56px_180px_1fr] sm:gap-6"
                                    aria-labelledby={`policy-${number}`}
                                >
                                    <span className="font-subtitle text-xs font-bold tabular-nums tracking-[0.08em] text-accent-400">
                                        {number}
                                    </span>
                                    <h3
                                        id={`policy-${number}`}
                                        className="col-start-2 flex items-start gap-3 font-display text-xl font-bold leading-6 text-white sm:col-start-auto"
                                    >
                                        <Icon
                                            size={19}
                                            className="mt-0.5 shrink-0 text-white/45 sm:hidden"
                                            aria-hidden="true"
                                        />
                                        {title}
                                    </h3>
                                    <p className="col-start-2 max-w-[68ch] font-subtitle text-sm font-medium leading-6 tracking-[0.01em] text-white/68 sm:col-start-auto">
                                        {body}
                                    </p>
                                </section>
                            ))}
                        </div>

                        <div className="mt-10 grid gap-6 border border-accent-400/35 bg-primary-950/45 p-6 sm:grid-cols-[auto_1fr] sm:items-start sm:p-8">
                            <IconScale
                                size={26}
                                className="text-accent-400"
                                aria-hidden="true"
                            />
                            <div>
                                <h3 className="font-display text-xl font-bold">
                                    Provisional policy copy
                                </h3>
                                <p className="mt-3 max-w-[64ch] font-subtitle text-sm font-medium leading-6 text-white/70">
                                    This notice is draft interface copy and should be reviewed by PCC administration, the Data Protection Officer, the Ethics Review body, and legal counsel before production use.
                                </p>
                            </div>
                        </div>

                        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6 font-subtitle text-xs text-white/48">
                            <p>Policy draft v0.1 Â· Last revised July 2026</p>
                            <p>Signing in records your access in the EDMS audit trail.</p>
                        </footer>
                    </div>
                </aside>
            </main>
        </>
    );
}