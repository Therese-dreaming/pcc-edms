import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { LockKey, Eye, EyeSlash, ShieldCheck, Warning } from '@phosphor-icons/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Confirm Password" />
            <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50/20 flex items-center justify-center p-4 font-sans">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-20 w-96 h-96 bg-red-100/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl"></div>
                </div>

                <div className="relative w-full max-w-md">
                    {/* Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200/50 p-8 md:p-10">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                {/* Security indicator ring */}
                                <div className="absolute -inset-2 bg-gradient-to-r from-red-900/20 to-red-800/20 rounded-2xl blur-lg"></div>
                                <div className="relative w-16 h-16 bg-gradient-to-br from-red-900 to-red-800 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/30 border-2 border-red-800/50">
                                    <ShieldCheck size={32} weight="duotone" className="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-stone-900 mb-3 font-display">
                                Confirm your password
                            </h1>
                            <p className="font-subtitle text-stone-600 leading-relaxed">
                                This is a secure area of the application. Please confirm your password before continuing.
                            </p>
                        </div>

                        {/* Security notice */}
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                            <Warning size={20} weight="fill" className="text-amber-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-amber-900 mb-1">
                                    Security verification required
                                </p>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    For your protection, you need to re-enter your password to access this sensitive area.
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-6">
                            {/* Password field */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-400">
                                        <LockKey size={20} weight="regular" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        autoFocus
                                        required
                                        className={`
                                            block w-full pl-12 pr-12 py-3
                                            bg-stone-50 border rounded-lg
                                            text-stone-900 placeholder-stone-400
                                            transition-all duration-150
                                            focus:outline-none focus:bg-white
                                            ${errors.password
                                                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                : 'border-stone-200 focus:border-red-900 focus:ring-2 focus:ring-red-900/15'
                                            }
                                        `}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 hover:text-stone-600 transition-colors"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeSlash size={20} weight="regular" /> : <Eye size={20} weight="regular" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="
                                    group relative w-full py-3.5 px-6
                                    bg-gradient-to-r from-red-900 via-red-800 to-red-900
                                    hover:from-red-950 hover:via-red-900 hover:to-red-950
                                    text-white font-semibold rounded-lg
                                    shadow-lg shadow-red-900/30
                                    hover:shadow-xl hover:shadow-red-900/40
                                    focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:ring-offset-2
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
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={20} weight="bold" />
                                            <span>Confirm</span>
                                        </>
                                    )}
                                </span>
                                
                                {/* Animated shine effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            </button>
                        </form>

                        {/* Security info */}
                        <div className="mt-8 pt-6 border-t border-stone-200">
                            <p className="text-xs text-center text-stone-500 flex items-center justify-center gap-1.5">
                                <LockKey size={14} weight="regular" className="text-stone-400" />
                                Your password is encrypted and never stored in plain text
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-stone-500 mt-6">
                        Need help? Contact{' '}
                        <a href="mailto:support@pcc.edu.ph" className="font-medium text-stone-700 hover:text-stone-900">
                            support@pcc.edu.ph
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}
