import { Head, Link, useForm } from '@inertiajs/react';
import { EnvelopeOpen, PaperPlaneRight, CheckCircle, SignOut } from '@phosphor-icons/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <>
            <Head title="Email Verification" />
            <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50/20 flex items-center justify-center p-4 font-sans">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-20 w-96 h-96 bg-red-100/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl"></div>
                </div>

                <div className="relative w-full max-w-lg">
                    {/* Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200/50 p-8 md:p-10">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                {/* Animated ring */}
                                <div className="absolute inset-0 bg-red-900/20 rounded-2xl animate-ping" style={{ animationDuration: '2s' }}></div>
                                <div className="relative w-16 h-16 bg-gradient-to-br from-red-900 to-red-800 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/30">
                                    <EnvelopeOpen size={32} weight="duotone" className="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-stone-900 mb-3 font-display">
                                Verify your email
                            </h1>
                            <p className="font-subtitle text-stone-600 leading-relaxed">
                                Thanks for signing up! Before getting started, please verify your email address by clicking the link we just sent you.
                            </p>
                        </div>

                        {/* Success message */}
                        {status === 'verification-link-sent' && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                                <CheckCircle size={20} weight="fill" className="text-green-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-green-900 mb-1">
                                        Verification email sent!
                                    </p>
                                    <p className="text-sm text-green-800 leading-relaxed">
                                        A new verification link has been sent to your email address.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Info box */}
                        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-stone-700 leading-relaxed mb-3">
                                <span className="font-medium">Didn't receive the email?</span> Check your spam folder or click the button below to send another verification link.
                            </p>
                            <ul className="text-xs text-stone-600 space-y-1.5">
                                <li className="flex items-start gap-2">
                                    <span className="inline-block w-1 h-1 bg-stone-400 rounded-full mt-1.5"></span>
                                    <span>Make sure you're checking the correct email inbox</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="inline-block w-1 h-1 bg-stone-400 rounded-full mt-1.5"></span>
                                    <span>The verification link expires after a certain time</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="inline-block w-1 h-1 bg-stone-400 rounded-full mt-1.5"></span>
                                    <span>Check your spam or junk mail folder</span>
                                </li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <form onSubmit={submit} className="space-y-4">
                            {/* Resend button */}
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
                                            <PaperPlaneRight size={20} weight="bold" />
                                            <span>Resend Verification Email</span>
                                        </>
                                    )}
                                </span>
                                
                                {/* Animated shine effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            </button>

                            {/* Logout button */}
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="
                                    group w-full py-3 px-6
                                    bg-stone-100 hover:bg-stone-200
                                    text-stone-700 font-medium rounded-lg
                                    border border-stone-200
                                    focus:outline-none focus:ring-2 focus:ring-stone-300/50 focus:ring-offset-2
                                    transition-all duration-200
                                    flex items-center justify-center gap-2
                                "
                            >
                                <SignOut size={20} weight="regular" />
                                <span>Log Out</span>
                            </Link>
                        </form>

                        {/* Help text */}
                        <div className="mt-8 pt-6 border-t border-stone-200">
                            <p className="text-xs text-center text-stone-500 leading-relaxed">
                                Having trouble verifying your email?{' '}
                                <a href="mailto:support@pcc.edu.ph" className="font-medium text-red-900 hover:text-red-800 transition-colors">
                                    Contact support
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-stone-500 mt-6">
                        Need immediate assistance? Email us at{' '}
                        <a href="mailto:support@pcc.edu.ph" className="font-medium text-stone-700 hover:text-stone-900">
                            support@pcc.edu.ph
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}
