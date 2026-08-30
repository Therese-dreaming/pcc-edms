import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, router, useForm } from '@inertiajs/react';

const TYPE_LABELS = {
    internal_ojt: 'Internal OJT',
    external_ojt: 'External OJT',
    community_service: 'Community Service',
};

// Roadmap A3 (2026-08-31) — coordinator batch onboarding: upload a CSV of trainees, review the
// preview (each row validated, reasons shown for failures), then confirm to create placements
// and draft NDAs in one go. Unknown emails get trainee accounts + emailed setup links, same as
// the single-placement flow.
export default function Import({ preview = null }) {
    const { data, setData, post, processing, errors } = useForm({ file: null });

    const validRows = (preview ?? []).filter((r) => r.valid);

    const upload = (e) => {
        e.preventDefault();
        post(route('dpnda.import.preview'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Import Trainees" />

            <div className="px-5 py-8 font-grotesk text-fg-primary sm:px-8 lg:px-12 lg:py-10">
                <div className="mx-auto max-w-6xl">
                    <section className="mb-8">
                        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.11em] text-primary-700">
                            DPNDA — batch onboarding
                        </p>
                        <h1 className="text-3xl font-extrabold leading-none tracking-[-0.045em]">
                            Import trainees
                        </h1>
                        <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-fg-secondary">
                            Upload a CSV with one row per trainee. Valid rows create a placement and a
                            draft NDA each; trainees without an account are invited by email. Nothing
                            is created until you confirm.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                        <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                            <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                1 — Upload CSV
                            </h2>
                        </div>
                        <form onSubmit={upload} className="space-y-4 p-6">
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => setData('file', e.target.files[0] ?? null)}
                                className="block w-full max-w-md text-sm text-fg-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-primary-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-800"
                            />
                            <InputError message={errors.file} />
                            <button
                                type="submit"
                                disabled={processing || !data.file}
                                className="inline-flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800 disabled:opacity-50"
                            >
                                Preview import
                            </button>
                            <details className="text-xs text-fg-tertiary">
                                <summary className="cursor-pointer font-semibold">Expected columns</summary>
                                <p className="mt-2 leading-relaxed">
                                    Required: <code>trainee_email, trainee_last_name, trainee_first_name,
                                    enrolled_school, trainee_type, department_assigned, start_date, end_date</code>.
                                    Optional: <code>gender, age, hours_needed, department, level, course, section,
                                    pcc_supervisor, endorsed_by, guardian_name</code>.
                                    trainee_type must be <code>internal_ojt</code>, <code>external_ojt</code> or
                                    <code> community_service</code>.
                                </p>
                            </details>
                        </form>
                    </section>

                    {preview && (
                        <section className="mt-6 overflow-hidden rounded-xl border border-border bg-surface-secondary">
                            <div className="flex items-center justify-between border-b border-border bg-surface-tertiary px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    2 — Preview ({validRows.length} valid / {preview.length} rows)
                                </h2>
                                {validRows.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => router.post(route('dpnda.import.confirm'))}
                                        className="inline-flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800"
                                    >
                                        Confirm import ({validRows.length})
                                    </button>
                                )}
                            </div>
                            <div className="overflow-x-auto p-6">
                                <table className="w-full min-w-[48rem] text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-xs uppercase tracking-wider text-fg-tertiary">
                                            <th className="px-3 py-2">Row</th>
                                            <th className="px-3 py-2">Trainee</th>
                                            <th className="px-3 py-2">Email</th>
                                            <th className="px-3 py-2">Type</th>
                                            <th className="px-3 py-2">Placement</th>
                                            <th className="px-3 py-2">Dates</th>
                                            <th className="px-3 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((r) => (
                                            <tr key={r.row} className="border-b border-border/60">
                                                <td className="px-3 py-2 text-fg-tertiary">{r.row}</td>
                                                <td className="px-3 py-2">
                                                    {r.data.trainee_first_name} {r.data.trainee_last_name}
                                                </td>
                                                <td className="px-3 py-2">{r.data.trainee_email ?? '—'}</td>
                                                <td className="px-3 py-2">{TYPE_LABELS[r.data.trainee_type] ?? r.data.trainee_type ?? '—'}</td>
                                                <td className="px-3 py-2">{r.data.department_assigned ?? '—'}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    {r.data.start_date ?? '?'} → {r.data.end_date ?? '?'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {r.valid ? (
                                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                                                            Valid
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800"
                                                            title={r.reason}
                                                        >
                                                            {r.reason}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
