import { Head, Link, useForm } from '@inertiajs/react';
import { EnvelopeSimple, ArrowLeft, PaperPlaneRight, CheckCircle } from '@phosphor-icons/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Forgot Password" />
            <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50/20 flex items-center justify-center p-4 font-sans">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-20 w-96 h-96 bg-red-100/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl"></div>
                </div>

                <div className="relative w-full max-w-md">
                    {/* Back to login */}
                    <Link 
                        href={route('login')}
                        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-8 group transition-colors"
                    >
                        <ArrowLeft size={20} weight="regular" className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to login</span>
                    </Link>

                    {/* Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200/50 p-8 md:p-10">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-900 to-red-800 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/30">
                                <EnvelopeSimple size={32} weight="duotone" className="text-white" />
                            </div>
                        </div>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-stone-900 mb-3 font-display">
                                Forgot your password?
                            </h1>
                            <p className="font-subtitle text-stone-600 leading-relaxed">
                                No worries! Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>

                        {/* Success message */}
                        {status && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                                <CheckCircle size={20} weight="fill" className="text-green-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-green-800 leading-relaxed">
                                    {status}
                                </p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-6">
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
                                        autoComplete="email"
                                        autoFocus
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
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Send Reset Link</span>
                                            <PaperPlaneRight 
                                                size={18} 
                                                weight="bold" 
                                                className="group-hover:translate-x-0.5 transition-transform" 
                                            />
                                        </>
                                    )}
                                </span>
                                
                                {/* Animated shine effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            </button>
                        </form>

                        {/* Help text */}
                        <div className="mt-8 pt-6 border-t border-stone-200">
                            <p className="text-xs text-center text-stone-500 leading-relaxed">
                                Remember your password?{' '}
                                <Link
                                    href={route('login')}
                                    className="font-medium text-red-900 hover:text-red-800 transition-colors"
                                >
                                    Sign in instead
                                </Link>
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
