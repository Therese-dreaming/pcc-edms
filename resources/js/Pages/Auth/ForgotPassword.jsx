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
            <div className="min-h-screen bg-surface-tertiary flex items-center justify-center p-4 font-sans">
                <div className="relative w-full max-w-md">
                    {/* Back to login */}
                    <Link
                        href={route('login')}
                        className="inline-flex items-center gap-2 text-fg-secondary hover:text-fg-primary mb-8 group transition-colors"
                    >
                        <ArrowLeft size={20} weight="regular" className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to login</span>
                    </Link>

                    {/* Card */}
                    <div className="bg-surface-secondary rounded-xl shadow-resting border border-border p-8 md:p-10">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center">
                                <EnvelopeSimple size={28} weight="regular" className="text-white" />
                            </div>
                        </div>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold tracking-tight text-fg-primary mb-3">
                                Forgot your password?
                            </h1>
                            <p className="text-fg-secondary leading-relaxed">
                                No worries! Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>

                        {/* Success message */}
                        {status && (
                            <div className="mb-6 p-4 bg-success-bg border border-success/20 rounded-lg flex items-start gap-3">
                                <CheckCircle size={20} weight="fill" className="text-success mt-0.5 shrink-0" />
                                <p className="text-sm text-success-text leading-relaxed">
                                    {status}
                                </p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-6">
                            {/* Email field */}
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
                                        autoComplete="email"
                                        autoFocus
                                        required
                                        className={`block w-full pl-12 pr-4 py-3 rounded-full border bg-surface-secondary text-fg-primary placeholder:text-fg-tertiary transition-colors focus:outline-none focus:ring-2 ${errors.email
                                            ? 'border-danger/40 focus:border-danger focus:ring-danger/15'
                                            : 'border-border-medium focus:border-primary focus:ring-primary-soft'
                                            }`}
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

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-strong disabled:opacity-60 disabled:cursor-not-allowed"
                            >
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
                                        <PaperPlaneRight size={18} weight="regular" className="group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Help text */}
                        <div className="mt-8 pt-6 border-t border-border">
                            <p className="text-xs text-center text-fg-tertiary leading-relaxed">
                                Remember your password?{' '}
                                <Link
                                    href={route('login')}
                                    className="font-semibold text-fg-primary-strong hover:underline"
                                >
                                    Sign in instead
                                </Link>
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
