import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { EnvelopeSimple, LockKey, Eye, EyeSlash, ShieldCheck } from '@phosphor-icons/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
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
            { strength: 1, label: 'Weak', color: 'bg-danger' },
            { strength: 2, label: 'Fair', color: 'bg-warning' },
            { strength: 3, label: 'Good', color: 'bg-warning' },
            { strength: 4, label: 'Strong', color: 'bg-success' },
        ];

        return levels[strength];
    };

    const passwordStrength = getPasswordStrength();

    return (
        <>
            <Head title="Reset Password" />
            <div className="min-h-screen bg-surface-tertiary flex items-center justify-center p-4 font-sans">
                <div className="relative w-full max-w-lg">
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
                                Reset your password
                            </h1>
                            <p className="text-fg-secondary leading-relaxed">
                                Choose a strong, unique password to secure your account.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-6">
                            {/* Email field (read-only) */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-fg-secondary">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-fg-tertiary">
                                        <EnvelopeSimple size={20} weight="regular" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        autoComplete="username"
                                        readOnly
                                        className="block w-full pl-12 pr-4 py-3 rounded-full border border-border bg-surface-tertiary text-fg-secondary cursor-not-allowed"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-danger-text flex items-center gap-1.5">
                                        <span className="inline-block w-1 h-1 bg-danger rounded-full"></span>
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-fg-secondary">
                                    New Password
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
                                        autoComplete="new-password"
                                        autoFocus
                                        required
                                        className={`block w-full pl-12 pr-12 py-3 rounded-full border bg-surface-secondary text-fg-primary placeholder:text-fg-tertiary transition-colors focus:outline-none focus:ring-2 ${errors.password
                                            ? 'border-danger/40 focus:border-danger focus:ring-danger/15'
                                            : 'border-border-medium focus:border-primary focus:ring-primary-soft'
                                            }`}
                                        placeholder="Enter new password"
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
                                
                                {/* Password strength indicator */}
                                {data.password && passwordStrength.strength > 0 && (
                                    <div className="space-y-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1.5 flex-1 rounded-full transition-all ${
                                                        level <= passwordStrength.strength ? passwordStrength.color : "bg-border"
                                                    }`}
                                                ></div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-fg-secondary">
                                            Password strength: <span className="font-medium">{passwordStrength.label}</span>
                                        </p>
                                    </div>
                                )}

                                {errors.password && (
                                    <p className="text-sm text-danger-text flex items-center gap-1.5">
                                        <span className="inline-block w-1 h-1 bg-danger rounded-full"></span>
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-fg-secondary">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-fg-tertiary">
                                        <LockKey size={20} weight="regular" />
                                    </div>
                                    <input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        autoComplete="new-password"
                                        required
                                        className={`block w-full pl-12 pr-12 py-3 rounded-full border bg-surface-secondary text-fg-primary placeholder:text-fg-tertiary transition-colors focus:outline-none focus:ring-2 ${errors.password_confirmation
                                            ? 'border-danger/40 focus:border-danger focus:ring-danger/15'
                                            : 'border-border-medium focus:border-primary focus:ring-primary-soft'
                                            }`}
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-fg-tertiary hover:text-fg-secondary transition-colors"
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirmPassword ? <EyeSlash size={20} weight="regular" /> : <Eye size={20} weight="regular" />}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="text-sm text-danger-text flex items-center gap-1.5">
                                        <span className="inline-block w-1 h-1 bg-danger rounded-full"></span>
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            {/* Password requirements hint */}
                            <div className="bg-surface-tertiary border border-border rounded-lg p-4">
                                <p className="text-xs text-fg-secondary font-medium mb-2">Password requirements:</p>
                                <ul className="text-xs text-fg-secondary space-y-1">
                                    <li className="flex items-center gap-2">
                                        <span className="inline-block w-1 h-1 bg-border-medium rounded-full"></span>
                                        At least 8 characters
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="inline-block w-1 h-1 bg-border-medium rounded-full"></span>
                                        Mix of uppercase and lowercase letters
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="inline-block w-1 h-1 bg-border-medium rounded-full"></span>
                                        At least one number
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="inline-block w-1 h-1 bg-border-medium rounded-full"></span>
                                        At least one special character
                                    </li>
                                </ul>
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
                                        <span>Resetting...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={20} weight="regular" />
                                        <span>Reset Password</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Security notice */}
                        <div className="mt-8 pt-6 border-t border-border">
                            <p className="text-xs text-center text-fg-tertiary flex items-center justify-center gap-1.5">
                                <LockKey size={14} weight="regular" className="text-fg-tertiary" />
                                After resetting, you'll be redirected to sign in with your new password
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
