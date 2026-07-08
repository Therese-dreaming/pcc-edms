import { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconMail, IconLock, IconEye, IconEyeOff, IconShieldCheck, IconArrowRight } from '@tabler/icons-react';
import { notifyResultError, notifySuccess } from '@/lib/confirm';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    useEffect(() => {
        if (status) {
            notifySuccess(status);
        }
    }, [status]);

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onError: () => {
                notifyResultError('Sign-in failed', 'Check your email and password, then try again.');
            },
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />

            <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row antialiased font-sans">
                {/* LEFT COLUMN - Sign In Form */}
                <div className="w-full lg:w-[40%] h-full overflow-y-auto bg-white flex flex-col">
                    {/* Logo & Institution Name */}
                    <div className="p-8 lg:p-12 shrink-0">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/logo-small.png"
                                alt="PCC Logo"
                                className="h-10 w-10 object-contain"
                            />
                            <div>
                                <h2 className="font-display text-lg font-bold text-paper-900 tracking-tight">
                                    Pasig Catholic College
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Form Container - Centered */}
                    <div className="flex-1 flex items-center justify-center px-8 lg:px-16 pb-12">
                        <div className="w-full max-w-md">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-5 bg-primary-700 rounded-2xl shadow-lg shadow-primary-900/30 ring-1 ring-primary-800/20">
                                    <IconShieldCheck size={32} className="text-white" aria-hidden="true" />
                                </div>
                                <h1 className="font-display text-3xl font-bold text-paper-900 mb-2.5 tracking-tight">
                                    Welcome back
                                </h1>
                                <p className="font-subtitle text-paper-600 text-base">
                                    Sign in to your account to continue
                                </p>
                            </div>

                            {/* Sign In Form */}
                            <form onSubmit={submit} className="space-y-5">
                                {/* Email field */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-paper-700"
                                    >
                                        Email address
                                    </label>

                                    <div className="relative">
                                        <div className={`
                                            absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none
                                            transition-colors duration-150
                                            ${emailFocused ? 'text-primary-800' : 'text-paper-400'}
                                        `}>
                                            <IconMail size={20} aria-hidden="true" />
                                        </div>

                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            autoComplete="username"
                                            autoFocus
                                            onChange={(e) => setData('email', e.target.value)}
                                            onFocus={() => setEmailFocused(true)}
                                            onBlur={() => setEmailFocused(false)}
                                            className={`
                                                block w-full pl-12 pr-4 py-3
                                                bg-paper-50 border rounded-md
                                                text-paper-900 placeholder-paper-400
                                                transition-colors duration-150
                                                focus:outline-none focus:bg-white
                                                ${errors.email
                                                    ? 'border-danger/40 focus:border-danger focus:ring-2 focus:ring-danger/20'
                                                    : 'border-paper-200 focus:border-primary-800 focus:ring-2 focus:ring-primary-800/15'
                                                }
                                            `}
                                            placeholder="you@pcc.edu.ph"
                                        />
                                    </div>

                                    {errors.email && (
                                        <p className="text-sm text-danger-text flex items-center gap-1.5">
                                            <span className="inline-block w-1 h-1 bg-danger rounded-full"></span>
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Password field */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="password"
                                            className="block text-sm font-medium text-paper-700"
                                        >
                                            Password
                                        </label>
                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-sm font-medium text-primary-800 hover:text-primary-700 transition-colors"
                                            >
                                                Forgot?
                                            </Link>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <div className={`
                                            absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none
                                            transition-colors duration-150
                                            ${passwordFocused ? 'text-primary-800' : 'text-paper-400'}
                                        `}>
                                            <IconLock size={20} aria-hidden="true" />
                                        </div>

                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            autoComplete="current-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                            onFocus={() => setPasswordFocused(true)}
                                            onBlur={() => setPasswordFocused(false)}
                                            className={`
                                                block w-full pl-12 pr-12 py-3
                                                bg-paper-50 border rounded-md
                                                text-paper-900 placeholder-paper-400
                                                transition-colors duration-150
                                                focus:outline-none focus:bg-white
                                                ${errors.password
                                                    ? 'border-danger/40 focus:border-danger focus:ring-2 focus:ring-danger/20'
                                                    : 'border-paper-200 focus:border-primary-800 focus:ring-2 focus:ring-primary-800/15'
                                                }
                                            `}
                                            placeholder="••••••••"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-paper-400 hover:text-paper-600 transition-colors"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? (
                                                <IconEyeOff size={20} aria-hidden="true" />
                                            ) : (
                                                <IconEye size={20} aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <p className="text-sm text-danger-text flex items-center gap-1.5">
                                            <span className="inline-block w-1 h-1 bg-danger rounded-full"></span>
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Remember me */}
                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded border-paper-300 text-primary-700 focus:ring-primary-700 focus:ring-offset-0 transition-colors cursor-pointer"
                                    />
                                    <label
                                        htmlFor="remember"
                                        className="ml-2.5 text-sm text-paper-700 cursor-pointer select-none"
                                    >
                                        Remember me
                                    </label>
                                </div>

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="
                                        group relative w-full py-3.5 px-6
                                        bg-primary-800
                                        hover:bg-primary-900
                                        text-white font-semibold rounded-lg
                                        shadow-lg shadow-primary-900/30
                                        hover:shadow-xl hover:shadow-primary-900/40
                                        focus:outline-none focus:ring-2 focus:ring-primary-900/30 focus:ring-offset-2
                                        disabled:opacity-60 disabled:cursor-not-allowed
                                        transition-all duration-200
                                        overflow-hidden
                                    "
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Signing in...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Sign in</span>
                                                <IconArrowRight
                                                    size={18}
                                                    stroke={2.5}
                                                    className="group-hover:translate-x-1 transition-transform duration-200"
                                                    aria-hidden="true"
                                                />
                                            </>
                                        )}
                                    </span>

                                    {/* Animated shine effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                </button>

                                {/* Sign up option */}
                                <p className="text-center text-sm text-paper-600">
                                    Don't have an account?{' '}
                                    <Link
                                        href="/register"
                                        className="font-medium text-primary-800 hover:text-primary-700 transition-colors"
                                    >
                                        Sign up
                                    </Link>
                                </p>
                            </form>

                            {/* Security notice */}
                            <div className="mt-6 pt-6 border-t border-paper-200">
                                <p className="text-xs text-center text-paper-500 flex items-center justify-center gap-1.5">
                                    <IconLock size={14} className="text-paper-400" aria-hidden="true" />
                                    Your credentials are encrypted and secure
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - Maroon Brand Section */}
                <div className="relative hidden lg:flex lg:w-[60%] h-full flex-col overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
                    {/* Gradient texture overlay */}
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: `
                                radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
                                radial-gradient(circle at 80% 80%, rgba(139, 30, 46, 0.4) 0%, transparent 50%),
                                radial-gradient(circle at 40% 20%, rgba(110, 23, 36, 0.3) 0%, transparent 50%)
                            `,
                        }}
                    ></div>

                    {/* Animated gradient orbs */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-700/20 rounded-full blur-3xl animate-pulse z-0" style={{ animationDuration: '8s' }}></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-900/40 rounded-full blur-3xl animate-pulse z-0" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>

                    {/* MASSIVE BACKGROUND LOGO */}
                    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Glow effect behind logo */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-[700px] h-[700px] bg-primary-900/10 rounded-full blur-3xl"></div>
                            </div>
                            {/* Large logo with maroon tint */}
                            <img
                                src="/images/logo-small.png"
                                alt="PCC Logo"
                                className="w-[450px] h-[450px] lg:w-[550px] lg:h-[550px] object-contain opacity-30"
                                style={{
                                    filter: 'drop-shadow(0 10px 40px rgba(0, 0, 0, 0.5)) sepia(70%) saturate(200%) hue-rotate(-10deg) brightness(0.5) contrast(1.1)',
                                    mixBlendMode: 'multiply'
                                }}
                            />
                        </div>
                    </div>

                    {/* Top Right Navigation */}
                    <div className="relative z-20 p-8 lg:p-12 flex justify-end shrink-0">
                        <nav className="flex items-center gap-3">
                            <Link
                                href="/register"
                                className="group relative px-5 py-2.5 rounded-lg text-white/90 hover:text-white font-medium text-sm transition-all duration-200 overflow-hidden"
                            >
                                <span className="relative z-10">Sign up</span>
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200"></div>
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                </div>
                            </Link>
                            <Link
                                href={route('about')}
                                className="group relative px-5 py-2.5 rounded-lg text-white/90 hover:text-white font-medium text-sm transition-all duration-200 overflow-hidden"
                            >
                                <span className="relative z-10">About</span>
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200"></div>
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                </div>
                            </Link>
                        </nav>
                    </div>

                    {/* Spacer for vertical centering */}
                    <div className="flex-1"></div>

                    {/* Bottom Right - EDMS Title & Description */}
                    <div className="relative z-20 p-8 lg:p-12 lg:pr-16 flex justify-end shrink-0">
                        <div className="max-w-3xl text-right">
                            <h2
                                className="font-display text-8xl lg:text-9xl text-white mb-6 leading-none"
                                style={{
                                    fontWeight: 800,
                                    letterSpacing: '-0.05em',
                                    textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                    transform: 'scaleY(1.1)',
                                    transformOrigin: 'bottom',
                                }}
                            >
                                EDMS
                            </h2>
                            <p className="font-subtitle text-white/95 text-xl lg:text-2xl font-medium leading-relaxed mb-4">
                                Electronic Document Management System
                            </p>
                            <p className="text-white/70 text-base lg:text-lg leading-relaxed max-w-xl ml-auto">
                                A comprehensive platform for managing research ethics applications,
                                data protection requests, and institutional compliance workflows.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
