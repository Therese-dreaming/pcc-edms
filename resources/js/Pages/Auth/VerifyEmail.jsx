import { Head, Link, router, useForm } from '@inertiajs/react';
import { EnvelopeOpen, PaperPlaneRight, CheckCircle, SignOut } from '@phosphor-icons/react';
import { useEffect } from 'react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    // C1 (concern 2) — if the user verifies on another device, this waiting tab notices and
    // redirects itself to the dashboard. Poll-based, matching the app's other live-update patterns.
    useEffect(() => {
        const timer = setInterval(async () => {
            try {
                const res = await fetch(route('verification.status'), {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                if (!res.ok) return;
                const { verified } = await res.json();
                if (verified) {
                    clearInterval(timer);
                    router.visit(route('dashboard'));
                }
            } catch {
                // Transient network error — keep polling.
            }
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <Head title="Email Verification" />
            <div className="min-h-screen bg-surface-tertiary flex items-center justify-center p-4 font-sans">
                <div className="relative w-full max-w-lg">
                    {/* Card */}
                    <div className="bg-surface-secondary rounded-xl shadow-resting border border-border p-8 md:p-10">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center">
                                <EnvelopeOpen size={28} weight="regular" className="text-white" />
                            </div>
                        </div>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold tracking-tight text-fg-primary mb-3">
                                Verify your email
                            </h1>
                            <p className="text-fg-secondary leading-relaxed">
                                Thanks for signing up! Before getting started, please verify your email address by clicking the link we just sent you.
                            </p>
                        </div>

                        {/* Success message */}
                        {status === 'verification-link-sent' && (
                            <div className="mb-6 p-4 bg-success-bg border border-success/20 rounded-lg flex items-start gap-3">
                                <CheckCircle size={20} weight="fill" className="text-success mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-success-text mb-1">
                                        Verification email sent!
                                    </p>
                                    <p className="text-sm text-success-text/80 leading-relaxed">
                                        A new verification link has been sent to your email address.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Info box */}
                        <div className="bg-surface-tertiary border border-border rounded-lg p-4 mb-6">
                            <p className="text-sm text-fg-secondary leading-relaxed mb-3">
                                <span className="font-semibold text-fg-primary">Didn't receive the email?</span> Check your spam folder or click the button below to send another verification link.
                            </p>
                            <ul className="text-xs text-fg-tertiary space-y-1.5">
                                <li className="flex items-start gap-2">
                                    <span className="inline-block w-1 h-1 bg-border-medium rounded-full mt-1.5"></span>
                                    <span>Make sure you're checking the correct email inbox</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="inline-block w-1 h-1 bg-border-medium rounded-full mt-1.5"></span>
                                    <span>The verification link expires after a certain time</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="inline-block w-1 h-1 bg-border-medium rounded-full mt-1.5"></span>
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
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-strong disabled:opacity-60 disabled:cursor-not-allowed"
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
                                        <PaperPlaneRight size={20} weight="regular" />
                                        <span>Resend Verification Email</span>
                                    </>
                                )}
                            </button>

                            {/* Logout button */}
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="flex w-full items-center justify-center gap-2 rounded-full border border-border-medium bg-surface-secondary px-6 py-3 text-sm font-semibold text-fg-secondary transition-colors hover:bg-surface-tertiary"
                            >
                                <SignOut size={20} weight="regular" />
                                <span>Log Out</span>
                            </Link>
                        </form>

                        {/* Help text */}
                        <div className="mt-8 pt-6 border-t border-border">
                            <p className="text-xs text-center text-fg-tertiary leading-relaxed">
                                Having trouble verifying your email?{' '}
                                <a href="mailto:support@pcc.edu.ph" className="font-semibold text-fg-primary-strong hover:underline">
                                    Contact support
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-fg-tertiary mt-6">
                        Need immediate assistance? Email us at{' '}
                        <a href="mailto:support@pcc.edu.ph" className="font-semibold text-fg-secondary hover:text-fg-primary">
                            support@pcc.edu.ph
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}
