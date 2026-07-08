import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { User, EnvelopeSimple, LockKey, Eye, EyeSlash, CheckCircle, ArrowLeft } from '@phosphor-icons/react';

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

    return (
        <>
            <Head title="Sign Up" />
            <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-white flex items-center justify-center p-4 lg:p-8 font-sans">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-red-100/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-80 h-80 bg-stone-200/40 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-50/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative w-full max-w-5xl">
                    {/* Back to login link */}
                    <Link 
                        href={route('login')}
                        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-8 group transition-colors"
                    >
                        <ArrowLeft size={20} weight="regular" className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to login</span>
                    </Link>

                    {/* Main card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200/50 overflow-hidden">
                        <div className="grid lg:grid-cols-5">
                            {/* Left Side - Branding (2 columns) */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-red-950 via-red-900 to-red-950 p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
                                {/* Gradient orbs for depth */}
                                <div className="absolute top-0 right-0 w-80 h-80 bg-red-800/20 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-950/40 rounded-full blur-3xl"></div>

                                <div className="relative z-10">
                                    {/* Logo */}
                                    <div className="flex items-center gap-3 mb-12">
                                        <img 
                                            src="/images/logo-small.png" 
                                            alt="PCC Logo" 
                                            className="h-12 w-12 object-contain"
                                        />
                                        <div>
                                            <h3 className="text-white font-bold text-lg font-display">
                                                Pasig Catholic College
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Hero text */}
                                    <div>
                                        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight font-display">
                                            Electronic Document Management
                                        </h1>
                                        <p className="text-white/90 text-lg leading-relaxed">
                                            Access the unified platform for research ethics review, data protection clearances, and compliance documentation.
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom features */}
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <CheckCircle size={20} weight="fill" className="text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">DPO & REC Integration</p>
                                            <p className="text-white/70 text-sm">Manage data privacy and ethics applications in one system</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <CheckCircle size={20} weight="fill" className="text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Digital Workflow</p>
                                            <p className="text-white/70 text-sm">Submit applications, sign NDAs, and track clearances online</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Form (3 columns) */}
                            <div className="lg:col-span-3 p-8 lg:p-16">
                                <div className="max-w-xl">
                                    {/* Header */}
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-bold text-stone-900 mb-2 font-display">
                                            Create your account
                                        </h2>
                                        <p className="font-subtitle text-stone-600">
                                            Register to access PCC-EDMS
                                        </p>
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={submit} className="space-y-6">
                                        {/* Name field */}
                                        <div className="space-y-2">
                                            <label htmlFor="name" className="block text-sm font-medium text-stone-700">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-400">
                                                    <User size={20} weight="regular" />
                                                </div>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    name="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    autoComplete="name"
                                                    autoFocus
                                                    required
                                                    className={`
                                                        block w-full pl-12 pr-4 py-3
                                                        bg-stone-50 border rounded-lg
                                                        text-stone-900 placeholder-stone-400
                                                        transition-all duration-150
                                                        focus:outline-none focus:bg-white
                                                        ${errors.name
                                                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                            : 'border-stone-200 focus:border-red-900 focus:ring-2 focus:ring-red-900/15'
                                                        }
                                                    `}
                                                    placeholder="Juan Dela Cruz"
                                                />
                                            </div>
                                            {errors.name && (
                                                <p className="text-sm text-red-600 flex items-center gap-1.5">
                                                    <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email field */}
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-400">
                                                    <EnvelopeSimple size={20} weight="regular" />
                                                </div>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    autoComplete="username"
                                                    required
                                                    className={`
                                                        block w-full pl-12 pr-4 py-3
                                                        bg-stone-50 border rounded-lg
                                                        text-stone-900 placeholder-stone-400
                                                        transition-all duration-150
                                                        focus:outline-none focus:bg-white
                                                        ${errors.email
                                                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                            : 'border-stone-200 focus:border-red-900 focus:ring-2 focus:ring-red-900/15'
                                                        }
                                                    `}
                                                    placeholder="you@pcc.edu.ph"
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="text-sm text-red-600 flex items-center gap-1.5">
                                                    <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>

                                        {/* Password fields - side by side on desktop */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Password */}
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
                                                        autoComplete="new-password"
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
                                                        placeholder="••••••••"
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
                                                {/* Password strength indicator */}
                                                {data.password && passwordStrength.strength > 0 && (
                                                    <div className="space-y-1">
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4].map((level) => (
                                                                <div
                                                                    key={level}
                                                                    className={`h-1 flex-1 rounded-full transition-all ${
                                                                        level <= passwordStrength.strength ? passwordStrength.color : 'bg-stone-200'
                                                                    }`}
                                                                ></div>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-stone-600">
                                                            Password strength: <span className="font-medium">{passwordStrength.label}</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {errors.password && (
                                                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                                                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                                        {errors.password}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Confirm Password */}
                                            <div className="space-y-2">
                                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-stone-700">
                                                    Confirm Password
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-400">
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
                                                        className={`
                                                            block w-full pl-12 pr-12 py-3
                                                            bg-stone-50 border rounded-lg
                                                            text-stone-900 placeholder-stone-400
                                                            transition-all duration-150
                                                            focus:outline-none focus:bg-white
                                                            ${errors.password_confirmation
                                                                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                                : 'border-stone-200 focus:border-red-900 focus:ring-2 focus:ring-red-900/15'
                                                            }
                                                        `}
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 hover:text-stone-600 transition-colors"
                                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                                    >
                                                        {showConfirmPassword ? <EyeSlash size={20} weight="regular" /> : <Eye size={20} weight="regular" />}
                                                    </button>
                                                </div>
                                                {errors.password_confirmation && (
                                                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                                                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                                        {errors.password_confirmation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Terms agreement */}
                                        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                                            <p className="text-xs text-stone-600 leading-relaxed">
                                                By creating an account, you agree to our{' '}
                                                <a href="#" className="text-red-900 hover:text-red-800 font-medium underline underline-offset-2">
                                                    Terms of Service
                                                </a>{' '}
                                                and{' '}
                                                <a href="#" className="text-red-900 hover:text-red-800 font-medium underline underline-offset-2">
                                                    Privacy Policy
                                                </a>
                                            </p>
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
                                                        <span>Creating account...</span>
                                                    </>
                                                ) : (
                                                    <span>Create Account</span>
                                                )}
                                            </span>
                                            
                                            {/* Animated shine effect */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                        </button>

                                        {/* Already have account */}
                                        <div className="text-center pt-4">
                                            <p className="text-sm text-stone-600">
                                                Already have an account?{' '}
                                                <Link
                                                    href={route('login')}
                                                    className="font-semibold text-red-900 hover:text-red-800 transition-colors"
                                                >
                                                    Sign in
                                                </Link>
                                            </p>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-stone-500 mt-8">
                        © 2026 Pasig Catholic College. All rights reserved.
                    </p>
                </div>
            </div>
        </>
    );
}
