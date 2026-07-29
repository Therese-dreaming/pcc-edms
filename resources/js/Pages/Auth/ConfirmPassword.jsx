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
            <div className="min-h-screen bg-surface-tertiary flex items-center justify-center p-4 font-sans">
                <div className="relative w-full max-w-md">
                    {/* Card */}
                    <div className="bg-surface-secondary rounded-xl shadow-resting border border-border p-8 md:p-10">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center">
                                <ShieldCheck size={28} weight="regular" className="text-white" />
                            </div>
                        </div>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold tracking-tight text-fg-primary mb-3">
                                Confirm your password
                            </h1>
                            <p className="text-fg-secondary leading-relaxed">
                                This is a secure area of the application. Please confirm your password before continuing.
                            </p>
                        </div>

                        {/* Security notice */}
                        <div className="mb-6 p-4 bg-warning-bg border border-warning/20 rounded-lg flex items-start gap-3">
                            <Warning size={20} weight="fill" className="text-warning mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-warning-text mb-1">
                                    Security verification required
                                </p>
                                <p className="text-xs text-warning-text/80 leading-relaxed">
                                    For your protection, you need to re-enter your password to access this sensitive area.
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-6">
                            {/* Password field */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-fg-secondary">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-fg-tertiary">
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
                                        className={`block w-full pl-12 pr-12 py-3 rounded-full border bg-surface-secondary text-fg-primary placeholder:text-fg-tertiary transition-colors focus:outline-none focus:ring-2 ${errors.password
                                            ? 'border-danger/40 focus:border-danger focus:ring-danger/15'
                                            : 'border-border-medium focus:border-primary focus:ring-primary-soft'
                                            }`}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-fg-tertiary hover:text-fg-secondary transition-colors"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeSlash size={20} weight="regular" /> : <Eye size={20} weight="regular" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-danger-text flex items-center gap-1.5">
                                        <span className="inline-block w-1 h-1 bg-danger rounded-full"></span>
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-strong disabled:opacity-60 disabled:cursor-not-allowed"
                            >
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
                                        <ShieldCheck size={20} weight="regular" />
                                        <span>Confirm</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Security info */}
                        <div className="mt-8 pt-6 border-t border-border">
                            <p className="text-xs text-center text-fg-tertiary flex items-center justify-center gap-1.5">
                                <LockKey size={14} weight="regular" className="text-fg-tertiary" />
                                Your password is encrypted and never stored in plain text
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-fg-tertiary mt-6">
                        Need help? Contact{' '}
                        <a href="mailto:support@pcc.edu.ph" className="font-semibold text-fg-secondary hover:text-fg-primary">
                            support@pcc.edu.ph
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}
