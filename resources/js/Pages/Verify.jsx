import { Head, Link, useForm } from '@inertiajs/react';
import {
    IconArrowLeft,
    IconCertificate,
    IconCircleCheck,
    IconCircleX,
    IconSearch,
} from '@tabler/icons-react';
import { useEffect } from 'react';
import { notifyResultError, notifyResultSuccess, notifyResultWarning } from '@/lib/confirm';

// docs/3.1, docs/1.1 — public, unauthenticated verification portal. Deliberately shows only
// clearance validity/status and the two tracking numbers — no researcher name or any other
// personal/study detail, per docs/3.1's "exposes no personal data beyond clearance
// validity/status."
export default function Verify({ result, searched }) {
    const { data, setData, get, processing } = useForm({ q: '' });

    const submit = (e) => {
        e.preventDefault();
        get(route('verify'), { data: { q: data.q } });
    };

    useEffect(() => {
        if (!searched) {
            return;
        }

        if (result?.valid) {
            notifyResultSuccess('Valid Clearance', 'This clearance is authentic and currently valid.');
        } else if (result) {
            notifyResultWarning('Clearance Expired', 'This clearance was issued but is no longer valid.');
        } else {
            notifyResultError('Not Found', 'No clearance matches that tracking number. Check it and try again.');
        }
        // Only re-fire when a new search actually completes, not on every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searched, result]);

    return (
        <>
            <Head title="Verify Clearance" />

            <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
                <div className="w-full max-w-lg">
                    <Link
                        href={route('login')}
                        className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                    >
                        <IconArrowLeft size={16} aria-hidden="true" />
                        Back to login
                    </Link>

                    <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                        <div className="p-8">
                            <div className="flex justify-center mb-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-700 shadow-sm">
                                    <IconCertificate size={32} className="text-white" aria-hidden="true" />
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="font-display text-2xl font-bold text-stone-900 mb-2">
                                    Verify a Clearance
                                </h1>
                                <p className="font-subtitle text-sm text-stone-600 leading-relaxed">
                                    Enter a DPREQ or REC tracking number — or scan the QR code on a clearance
                                    certificate — to check its authenticity and validity.
                                </p>
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label htmlFor="q" className="block text-sm font-medium text-stone-700 mb-1.5">
                                        Tracking Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <IconSearch size={18} className="text-stone-400" />
                                        </div>
                                        <input
                                            id="q"
                                            type="text"
                                            placeholder="DPREQ-2026-0001 or REC-2026-0001"
                                            value={data.q}
                                            onChange={(e) => setData('q', e.target.value)}
                                            className="block w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-md bg-white text-stone-900 placeholder-stone-400 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary-700 hover:bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IconSearch size={16} strokeWidth={2.5} aria-hidden="true" />
                                    {processing ? 'Checking...' : 'Verify'}
                                </button>
                            </form>

                            {searched && (
                                <div className="mt-6">
                                    {result ? (
                                        result.valid ? (
                                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                                                <IconCircleCheck size={20} className="text-emerald-700 mt-0.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                                                <div className="text-sm">
                                                    <p className="font-semibold text-emerald-900 mb-2">Valid Clearance</p>
                                                    <dl className="space-y-1 text-emerald-800">
                                                        <div><dt className="inline font-medium">DPREQ Tracking Number: </dt><dd className="inline">{result.dpreq_certificate_number}</dd></div>
                                                        <div><dt className="inline font-medium">REC Tracking Number: </dt><dd className="inline">{result.remis_certificate_number}</dd></div>
                                                        <div><dt className="inline font-medium">Issued: </dt><dd className="inline">{result.issued_at}</dd></div>
                                                        <div><dt className="inline font-medium">Valid Until: </dt><dd className="inline">{result.valid_until}</dd></div>
                                                    </dl>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                                <IconCircleX size={20} className="text-red-700 mt-0.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                                                <div className="text-sm">
                                                    <p className="font-semibold text-red-900 mb-2">Clearance Expired</p>
                                                    <dl className="space-y-1 text-red-800">
                                                        <div><dt className="inline font-medium">DPREQ Tracking Number: </dt><dd className="inline">{result.dpreq_certificate_number}</dd></div>
                                                        <div><dt className="inline font-medium">REC Tracking Number: </dt><dd className="inline">{result.remis_certificate_number}</dd></div>
                                                        <div><dt className="inline font-medium">Issued: </dt><dd className="inline">{result.issued_at}</dd></div>
                                                        <div><dt className="inline font-medium">Valid Until: </dt><dd className="inline">{result.valid_until}</dd></div>
                                                    </dl>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg flex items-start gap-3">
                                            <IconCircleX size={20} className="text-stone-500 mt-0.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                                            <p className="text-sm text-stone-600">
                                                Not found or invalid. Please check the tracking number and try again.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="mt-6 text-center text-xs text-stone-500">
                        Pasig Catholic College — Electronic Document Management System
                    </p>
                </div>
            </div>
        </>
    );
}
