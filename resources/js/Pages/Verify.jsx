import GuestLayout from '@/Layouts/GuestLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, router, useForm } from '@inertiajs/react';

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

    return (
        <GuestLayout>
            <Head title="Verify Clearance" />

            <h1 className="mb-4 text-lg font-semibold text-gray-800">
                PCC-EDMS Clearance Verification
            </h1>
            <p className="mb-4 text-sm text-gray-600">
                Enter a DPREQ or REC tracking number (or scan the QR code on a clearance
                certificate) to check its authenticity and validity.
            </p>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="q" value="Tracking Number" />
                    <TextInput
                        id="q"
                        className="mt-1 block w-full"
                        placeholder="DPREQ-2026-0001 or REC-2026-0001"
                        value={data.q}
                        onChange={(e) => setData('q', e.target.value)}
                    />
                </div>
                <PrimaryButton disabled={processing}>Verify</PrimaryButton>
            </form>

            {searched && (
                <div className="mt-6 rounded-md border p-4">
                    {result ? (
                        <div className={result.valid ? 'text-green-700' : 'text-red-700'}>
                            <p className="font-semibold">
                                {result.valid ? 'Valid Clearance' : 'Clearance Expired'}
                            </p>
                            <dl className="mt-2 space-y-1 text-sm text-gray-700">
                                <div><dt className="inline font-medium">DPREQ Tracking Number: </dt><dd className="inline">{result.dpreq_certificate_number}</dd></div>
                                <div><dt className="inline font-medium">REC Tracking Number: </dt><dd className="inline">{result.remis_certificate_number}</dd></div>
                                <div><dt className="inline font-medium">Issued: </dt><dd className="inline">{result.issued_at}</dd></div>
                                <div><dt className="inline font-medium">Valid Until: </dt><dd className="inline">{result.valid_until}</dd></div>
                            </dl>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">
                            Not found or invalid. Please check the tracking number and try again.
                        </p>
                    )}
                </div>
            )}
        </GuestLayout>
    );
}
