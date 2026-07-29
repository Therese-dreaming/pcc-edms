import { Head, useForm } from '@inertiajs/react';
import {
    IconCertificate,
    IconCircleCheck,
    IconCircleX,
    IconClockX,
    IconWritingSign,
} from '@tabler/icons-react';
import SignaturePad from '@/Components/SignaturePad';
import InputError from '@/Components/InputError';

// Hoisted to module scope so their function identity is stable across renders. When these lived
// inside the component body, every setData keystroke re-created them, so React unmounted/remounted
// the subtree and the focused input lost focus after a single character (concern 1 / A1).
const Shell = ({ children }) => (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-lg">
            <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-8">{children}</div>
            </div>
            <p className="mt-6 text-center text-xs text-stone-500">
                Pasig Catholic College — Electronic Document Management System
            </p>
        </div>
    </div>
);

const Header = ({ icon: Icon, tone = 'primary', title, subtitle }) => {
    const tones = {
        primary: 'bg-primary-700',
        green: 'bg-emerald-600',
        red: 'bg-red-600',
        amber: 'bg-amber-500',
    };
    return (
        <div className="text-center mb-6">
            <div className="flex justify-center mb-5">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${tones[tone]} shadow-sm`}>
                    <Icon size={32} className="text-white" aria-hidden="true" />
                </div>
            </div>
            <h1 className="font-display text-2xl font-bold text-stone-900 mb-2">{title}</h1>
            {subtitle && <p className="font-subtitle text-sm text-stone-600 leading-relaxed">{subtitle}</p>}
        </div>
    );
};

// stakeholder-additional-features.md (2026-07-25) — public, token-gated per-member NDA signing
// page. Standalone (no authenticated layout): the visitor is a research member who arrived via a
// unique emailed link. Renders one of four states resolved server-side: usable / used / expired /
// invalid.
export default function Sign({ token, state, member, nda, signedAt }) {
    const { data, setData, post, processing, errors } = useForm({
        typed_full_name: member?.full_name ?? '',
        signature_image: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('nda.sign.submit', token), { preserveScroll: true });
    };

    if (state === 'invalid') {
        return (
            <>
                <Head title="Signing link" />
                <Shell>
                    <Header icon={IconCircleX} tone="red" title="Link not valid" subtitle="This signing link isn't recognized. Please use the exact link from your invitation email, or ask the research team leader to resend it." />
                </Shell>
            </>
        );
    }

    if (state === 'expired') {
        return (
            <>
                <Head title="Signing link expired" />
                <Shell>
                    <Header icon={IconClockX} tone="amber" title="Link expired" subtitle="This signing link has expired. Ask the research team leader to resend your invitation to get a fresh link." />
                </Shell>
            </>
        );
    }

    if (state === 'used') {
        return (
            <>
                <Head title="NDA signed" />
                <Shell>
                    <Header icon={IconCircleCheck} tone="green" title="Signature recorded" subtitle={`Thank you. Your signature for the Research Team NDA ${nda?.tracking_number ?? ''} has been recorded${signedAt ? ` on ${signedAt}` : ''}. No further action is needed.`} />
                </Shell>
            </>
        );
    }

    // usable
    return (
        <>
            <Head title="Sign the Research Team NDA" />
            <Shell>
                <Header
                    icon={IconWritingSign}
                    title="Sign the Research Team NDA"
                    subtitle="You have been listed as a research team member. Please review and sign the Non-Disclosure Agreement below."
                />

                <div className="mb-6 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
                    <dl className="space-y-1.5 text-stone-700">
                        <div className="flex gap-2"><dt className="font-medium text-stone-500 w-28 shrink-0">Study</dt><dd>{nda?.research_title}</dd></div>
                        <div className="flex gap-2"><dt className="font-medium text-stone-500 w-28 shrink-0">NDA No.</dt><dd>{nda?.tracking_number}</dd></div>
                        <div className="flex gap-2"><dt className="font-medium text-stone-500 w-28 shrink-0">Member</dt><dd>{member?.full_name} <span className="text-stone-400">({member?.role})</span></dd></div>
                    </dl>
                </div>

                <div className="mb-6 max-h-40 overflow-y-auto rounded-lg border border-stone-200 p-4 text-xs leading-relaxed text-stone-600">
                    <p className="mb-2 font-semibold text-stone-700">Non-Disclosure Agreement</p>
                    <p className="mb-2">
                        As a member of this research team, I agree to keep confidential all personal data and
                        sensitive information accessed in the course of this study, to use it only for the
                        study's approved purpose, and to follow the institution's data-privacy and research-ethics
                        requirements. I understand this electronic signature — my typed full name together with the
                        recorded date, time, and originating device — is legally binding under RA 8792.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label htmlFor="typed_full_name" className="block text-sm font-medium text-stone-700 mb-1.5">
                            Type your full name to sign
                        </label>
                        <input
                            id="typed_full_name"
                            type="text"
                            value={data.typed_full_name}
                            onChange={(e) => setData('typed_full_name', e.target.value)}
                            required
                            className="block w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition-colors focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                            placeholder="e.g. Maria Santos"
                        />
                        <InputError message={errors.typed_full_name} className="mt-2" />
                    </div>

                    <SignaturePad onChange={(img) => setData('signature_image', img)} />

                    <InputError message={errors.token} className="mt-1" />

                    <button
                        type="submit"
                        disabled={processing || !data.typed_full_name}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <IconCertificate size={16} strokeWidth={2.5} aria-hidden="true" />
                        {processing ? 'Recording…' : 'Sign the NDA'}
                    </button>
                    <p className="text-center text-xs text-stone-500">
                        This link is unique to you, can be used only once, and will record your IP address and device.
                    </p>
                </form>
            </Shell>
        </>
    );
}
