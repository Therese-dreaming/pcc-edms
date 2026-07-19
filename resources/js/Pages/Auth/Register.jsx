import { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    IconArrowRight,
    IconBook2,
    IconBriefcase2,
    IconEye,
    IconEyeOff,
    IconLoader2,
    IconLock,
    IconMail,
    IconShieldCheck,
    IconUser,
} from '@tabler/icons-react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    // Password strength indicator
    const getPasswordStrength = () => {
        const password = data.password;
        if (!password) return { strength: 0, label: '', color: '' };
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/\d/)) strength++;
        if (password.match(/[^a-zA-Z\d]/)) strength++;

        const levels = [
            { strength: 0, label: '', color: '' },
            { strength: 1, label: 'Weak', color: 'bg-red-500' },
            { strength: 2, label: 'Fair', color: 'bg-orange-500' },
            { strength: 3, label: 'Good', color: 'bg-yellow-500' },
            { strength: 4, label: 'Strong', color: 'bg-green-500' },
        ];

        return levels[strength];
    };

    const passwordStrength = getPasswordStrength();

    const inputClass = (error) => `
        block h-[52px] w-full rounded-[10px] border bg-paper-50 py-3 pl-12 pr-12
        text-paper-900 placeholder:text-paper-400 transition-[background-color,border-color,box-shadow]
        duration-150 focus:bg-white focus:outline-none
        ${error
            ? 'border-danger/50 focus:border-danger focus:ring-4 focus:ring-danger/10'
            : 'border-paper-200 hover:border-paper-300 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10'}
    `;

    return (
        <>
            <Head title="Create Account" />
            <main className="grid min-h-screen bg-paper-50 font-sans text-paper-900 lg:grid-cols-[minmax(430px,40%)_1fr]">
                <section className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-paper-50 px-5 py-6 sm:px-10 lg:px-12 lg:py-9 xl:px-[clamp(52px,5vw,76px)]" aria-labelledby="register-title">
                    <Link href="/" className="flex w-fit items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20">
                        <img src="/images/logo-small.png" alt="PCC Logo" className="h-11 w-11 object-contain" />
                        <span className="grid gap-0.5">
                            <strong className="font-display text-[17px] font-bold tracking-tight">Pasig Catholic College</strong>
                            <span className="font-subtitle text-[11px] font-bold uppercase tracking-[0.09em] text-paper-500">Electronic Document Management System</span>
                        </span>
                    </Link>

                    <p className="mt-6 border-t border-paper-200 pt-4 font-subtitle text-sm font-semibold text-paper-600 lg:hidden">For Research and On-the-Job Training</p>

                    <div className="flex items-center py-12">
                        <div className="mx-auto w-full max-w-[430px]">
                            <p className="mb-3 font-subtitle text-xs font-bold uppercase tracking-[0.11em] text-primary-700">Join the platform</p>
                            <h1 id="register-title" className="font-display text-[40px] font-extrabold leading-none tracking-[-0.045em] sm:text-5xl">Create account</h1>
                            <p className="mb-8 mt-4 max-w-[38ch] font-subtitle text-base leading-relaxed text-paper-600">Register to access PCC-EDMS and manage your research and training workflows.</p>
                            <form onSubmit={submit} className="grid gap-5">
                                {/* Name */}
                                <div className="grid gap-2">
                                    <label htmlFor="name" className="font-subtitle text-[13px] font-bold text-paper-800">Full Name</label>
                                    <div className="group relative">
                                        <IconUser size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper-400 group-focus-within:text-primary-700" />
                                        <input id="name" type="text" name="name" value={data.name} autoComplete="name" autoFocus required onChange={(e) => setData('name', e.target.value)} className={inputClass(errors.name)} placeholder="Juan Dela Cruz" aria-invalid={Boolean(errors.name)} />
                                    </div>
                                    {errors.name && <p className="font-subtitle text-sm text-danger-text">{errors.name}</p>}
                                </div>

                                {/* Email */}
                                <div className="grid gap-2">
                                    <label htmlFor="email" className="font-subtitle text-[13px] font-bold text-paper-800">Email address</label>
                                    <div className="group relative">
                                        <IconMail size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper-400 group-focus-within:text-primary-700" />
                                        <input id="email" type="email" name="email" value={data.email} autoComplete="username" required onChange={(e) => setData('email', e.target.value)} className={inputClass(errors.email)} placeholder="you@pcc.edu.ph" aria-invalid={Boolean(errors.email)} />
                                    </div>
                                    {errors.email && <p className="font-subtitle text-sm text-danger-text">{errors.email}</p>}
                                </div>
                                {/* Password */}
                                <div className="grid gap-2">
                                    <label htmlFor="password" className="font-subtitle text-[13px] font-bold text-paper-800">Password</label>
                                    <div className="group relative">
                                        <IconLock size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper-400 group-focus-within:text-primary-700" />
                                        <input id="password" type={showPassword ? 'text' : 'password'} name="password" value={data.password} autoComplete="new-password" required onChange={(e) => setData('password', e.target.value)} className={inputClass(errors.password)} placeholder="Enter your password" aria-invalid={Boolean(errors.password)} />
                                        <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-lg text-paper-400 hover:bg-paper-100 hover:text-paper-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                            {showPassword ? <IconEyeOff size={19} /> : <IconEye size={19} />}
                                        </button>
                                    </div>
                                    {/* Password strength indicator */}
                                    {data.password && passwordStrength.strength > 0 && (
                                        <div className="grid gap-1.5">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map((level) => (
                                                    <div
                                                        key={level}
                                                        className={`h-1 flex-1 rounded-full transition-all ${
                                                            level <= passwordStrength.strength ? passwordStrength.color : 'bg-paper-200'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="font-subtitle text-xs text-paper-600">
                                                Password strength: <span className="font-bold">{passwordStrength.label}</span>
                                            </p>
                                        </div>
                                    )}
                                    {errors.password && <p className="font-subtitle text-sm text-danger-text">{errors.password}</p>}
                                </div>

                                {/* Confirm Password */}
                                <div className="grid gap-2">
                                    <label htmlFor="password_confirmation" className="font-subtitle text-[13px] font-bold text-paper-800">Confirm Password</label>
                                    <div className="group relative">
                                        <IconLock size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper-400 group-focus-within:text-primary-700" />
                                        <input id="password_confirmation" type={showConfirmPassword ? 'text' : 'password'} name="password_confirmation" value={data.password_confirmation} autoComplete="new-password" required onChange={(e) => setData('password_confirmation', e.target.value)} className={inputClass(errors.password_confirmation)} placeholder="Confirm your password" aria-invalid={Boolean(errors.password_confirmation)} />
                                        <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-lg text-paper-400 hover:bg-paper-100 hover:text-paper-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                                            {showConfirmPassword ? <IconEyeOff size={19} /> : <IconEye size={19} />}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && <p className="font-subtitle text-sm text-danger-text">{errors.password_confirmation}</p>}
                                </div>

                                {/* Terms agreement */}
                                <div className="rounded-[10px] border border-paper-200 bg-paper-100 p-4">
                                    <p className="font-subtitle text-xs leading-relaxed text-paper-600">
                                        By creating an account, you agree to our{' '}
                                        <a href="#" className="font-bold text-primary-700 underline-offset-4 hover:underline">
                                            Terms of Service
                                        </a>{' '}
                                        and{' '}
                                        <a href="#" className="font-bold text-primary-700 underline-offset-4 hover:underline">
                                            Privacy Policy
                                        </a>
                                    </p>
                                </div>

                                {/* Submit button */}
                                <button type="submit" disabled={processing} className="group flex h-[54px] items-center justify-center gap-2.5 rounded-[10px] bg-primary-800 px-6 font-subtitle font-bold text-white shadow-lg shadow-primary-900/20 transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-primary-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/25 disabled:cursor-wait disabled:opacity-70">
                                    {processing ? <><span>Creating account</span><IconLoader2 size={18} className="animate-spin" /></> : <><span>Create Account</span><IconArrowRight size={18} stroke={2.5} className="transition-transform group-hover:translate-x-1" /></>}
                                </button>

                                {/* Already have account */}
                                <p className="text-center font-subtitle text-sm text-paper-600">Already have an account? <Link href={route('login')} className="font-bold text-primary-700 underline-offset-4 hover:underline">Sign in</Link></p>
                            </form>
                        </div>
                    </div>

                    <p className="flex items-center gap-2 font-subtitle text-xs text-paper-500">
                        <IconShieldCheck size={15} aria-hidden="true" />
                        Encrypted connection. Never share your password or one-time codes.
                    </p>
                </section>
                <aside className="relative isolate hidden min-h-screen overflow-hidden bg-primary-900 px-[clamp(40px,5vw,76px)] pb-14 pt-9 text-white lg:grid lg:grid-rows-[auto_1fr_auto]" aria-label="About EDMS">
                    <div className="pointer-events-none absolute inset-0 -z-30" style={{ background: 'radial-gradient(circle at 80% 18%, oklch(44% 0.13 24), transparent 35%), radial-gradient(circle at 12% 96%, oklch(18% 0.07 8), transparent 44%), linear-gradient(145deg, oklch(40% 0.13 18), oklch(22% 0.085 18))' }} />

                    {/* Huge low-opacity PCC watermark */}
                    <div className="pointer-events-none absolute inset-[2%_-5%_3%_4%] -z-20 grid place-items-center" aria-hidden="true">
                        <img src="/images/logo-small.png" alt="" className="h-[min(72vw,900px)] w-[min(72vw,900px)] object-contain opacity-[0.095] grayscale brightness-[2.1] contrast-75" />
                    </div>

                    <nav className="flex justify-end gap-2" aria-label="Account navigation">
                        <Link href={route('about')} className="flex min-h-11 items-center rounded-lg px-4 font-subtitle text-sm font-bold text-white/85 hover:bg-white/10">About</Link>
                        <Link href={route('login')} className="flex min-h-11 items-center rounded-lg border border-white/20 px-4 font-subtitle text-sm font-bold text-white/90 hover:bg-white/10">Sign in</Link>
                    </nav>

                    {/* Paper-document composition */}
                    <div className="relative grid min-h-[390px] place-items-center" aria-hidden="true">
                        <div className="relative h-[330px] w-[min(75%,560px)]">
                            <div className="absolute left-[14%] top-5 h-[294px] w-[230px] -rotate-[10deg] rounded bg-accent-100/70 shadow-2xl" />
                            <div className="absolute left-1/2 top-1 h-[294px] w-[230px] -translate-x-1/2 rotate-[5deg] rounded bg-paper-100/90 shadow-2xl" />
                            <div className="absolute right-[8%] top-6 h-[294px] w-[230px] -rotate-2 rounded bg-paper-50 p-7 text-paper-900 shadow-2xl">
                                <p className="font-subtitle text-[9px] font-extrabold uppercase tracking-[0.12em] text-primary-700">Electronic document</p>
                                <p className="mt-4 font-display text-[25px] font-extrabold leading-[1.05] tracking-[-0.035em]">Institutional Workflow Record</p>
                                <div className="mt-4 h-[5px] rounded-full bg-paper-200" />
                                <div className="mt-3 h-[5px] rounded-full bg-paper-200" />
                                <div className="mt-3 h-[5px] w-[63%] rounded-full bg-paper-200" />
                                <div className="mt-6 grid h-16 w-16 -rotate-[8deg] place-items-center rounded-full border-2 border-primary-700 text-center font-subtitle text-[9px] font-extrabold tracking-[0.07em] text-primary-700">PCC<br />VERIFIED</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] items-end gap-8">
                        <div>
                            <h2 className="max-w-3xl font-display text-[clamp(42px,5.4vw,76px)] font-extrabold leading-[0.96] tracking-[-0.055em]">Electronic Document <span className="text-accent-400">Management System</span></h2>
                            <p className="mt-5 max-w-[60ch] font-subtitle text-base font-medium leading-relaxed tracking-[0.01em] text-white/75">The Electronic Document Management System for Research and On-the-Job Training, from submission through review, approval, and secure archiving.</p>
                            <div className="mt-6 flex gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 font-subtitle text-xs font-bold"><IconBook2 size={14} className="text-accent-400" />Research</span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 font-subtitle text-xs font-bold"><IconBriefcase2 size={14} className="text-accent-400" />OJT</span>
                            </div>
                        </div>
                        <p className="pb-1 font-subtitle text-[11px] font-bold uppercase tracking-[0.11em] text-white/45 [writing-mode:vertical-rl]">PCC EDMS · 2026</p>
                    </div>
                </aside>
            </main>
        </>
    );
}
