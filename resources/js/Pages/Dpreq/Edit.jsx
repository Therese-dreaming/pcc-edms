import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import SignaturePad from '@/Components/SignaturePad';
import SelectWithOther, { CHOICE_OPTIONS, splitChoice } from '@/Components/SelectWithOther';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';

const APPLICANT_TYPE_LABELS = {
    internal_researcher: 'Internal Researcher',
    external_researcher: 'External Researcher',
    student: 'Student',
};

const dateInput = (value) => (value ? String(value).slice(0, 10) : '');
const asCsv = (value) => (Array.isArray(value) ? value.join(', ') : (value ?? ''));

// Edit only the fields that appear on Form 1 (stakeholder 2026-07-28). Saving regenerates the Form 1
// PDF when something actually changed. Ethics-only fields are edited on the REMIS side.
export default function Edit({ application, research = {}, applicantType = 'internal_researcher' }) {
    const [collMethod, collMethodOther] = splitChoice(research.data_collection_method, 'data_collection_method');
    const [capTool, capToolOther] = splitChoice(research.data_capturing_tool, 'data_capturing_tool');

    const { data, setData, put, transform, processing, errors } = useForm({
        research_title: research.research_title ?? '',
        adviser_name: research.adviser_name ?? '',
        applicant_category: research.applicant_category ?? 'student',
        department: research.department ?? '',
        level: research.level ?? '',
        course: research.course ?? '',
        section: research.section ?? '',
        position: research.position ?? '',
        respondents: research.respondents ?? '',
        target_respondent_count: research.target_respondent_count ?? '',
        data_collection_method: collMethod,
        data_collection_method_other: collMethodOther,
        data_capturing_tool: capTool,
        data_capturing_tool_other: capToolOther,
        target_start_date: dateInput(research.target_start_date),
        target_end_date: dateInput(research.target_end_date),
        minors_involved: Boolean(research.minors_involved),
        respondent_head_letter_approved: Boolean(research.respondent_head_letter_approved),
        review_checklist: {
            voluntary_participation: research.review_checklist?.voluntary_participation ?? 'yes',
            confidentiality: research.review_checklist?.confidentiality ?? 'yes',
            free_withdrawal: research.review_checklist?.free_withdrawal ?? 'yes',
            avoid_harm: research.review_checklist?.avoid_harm ?? 'yes',
            academic_use_only: research.review_checklist?.academic_use_only ?? 'yes',
        },
        purpose: application.purpose ?? '',
        data_types: asCsv(application.data_types),
        data_subjects: asCsv(application.data_subjects),
        retention_plan: application.retention_plan ?? '',
        third_party_sharing: Boolean(application.third_party_sharing),
        third_party_detail: application.third_party_detail ?? '',
        researcher_signature: null,
    });

    const setChecklist = (key, value) => setData('review_checklist', { ...data.review_checklist, [key]: value });

    const submit = (e) => {
        e.preventDefault();
        transform((formData) => ({
            ...formData,
            data_types: formData.data_types ? formData.data_types.split(',').map((s) => s.trim()).filter(Boolean) : [],
            data_subjects: formData.data_subjects ? formData.data_subjects.split(',').map((s) => s.trim()).filter(Boolean) : [],
        }));
        put(route('dpreq.update', application.id), {
            onError: () => requestAnimationFrame(() =>
                document.getElementById('dpreq-edit-errors')?.scrollIntoView({ behavior: 'smooth', block: 'center' })),
        });
    };

    const input = 'mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10';
    const labelCls = 'block text-xs font-bold text-fg-secondary';

    return (
        <AuthenticatedLayout>
            <Head title={`Edit ${application.tracking_number}`} />

            <div className="px-5 py-8 font-grotesk text-fg-primary sm:px-8 lg:px-12 lg:py-10">
                <div className="mx-auto max-w-[90rem]">
                    <section className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row">
                        <div>
                            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.11em] text-primary-700">
                                Editing · {application.tracking_number}
                            </p>
                            <h1 className="text-3xl font-extrabold leading-none tracking-[-0.045em] lg:text-4xl">Edit application</h1>
                            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-fg-secondary">
                                These are the Form 1 fields. Saving a change regenerates Form 1 as a new version.
                            </p>
                        </div>
                        <Link href={route('dpreq.show', application.id)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface-secondary px-4 text-sm font-bold text-fg-secondary shadow-sm hover:bg-surface-tertiary">
                            <IconArrowLeft size={18} /> Back
                        </Link>
                    </section>

                    <form onSubmit={submit} className="space-y-8">
                        {Object.keys(errors).length > 0 && (
                            <div id="dpreq-edit-errors" className="rounded-xl border border-danger/40 bg-danger-bg px-5 py-4">
                                <p className="text-sm font-bold text-danger-text">Please fix the highlighted fields.</p>
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger-text/90">
                                    {Object.entries(errors).map(([k, m]) => <li key={k}>{m}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* Section A */}
                        <Section title="Section A — Applicant Information">
                            <Field id="research_title" label="Research Title" required error={errors.research_title}>
                                <input id="research_title" type="text" className={input} value={data.research_title} onChange={(e) => setData('research_title', e.target.value)} required />
                            </Field>
                            <Field id="adviser_name" label="Adviser's Name" required error={errors.adviser_name}>
                                <input id="adviser_name" type="text" className={input} value={data.adviser_name} onChange={(e) => setData('adviser_name', e.target.value)} required />
                            </Field>

                            {/* Category is fixed on the account and no longer editable here
                                (2026-09-05) — shown read-only. */}
                            <div>
                                <span className={labelCls}>Filing as</span>
                                <p className="mt-1.5 inline-flex items-center rounded-lg border border-border-medium bg-surface-tertiary/50 px-3 py-1.5 text-sm font-semibold text-fg-secondary">
                                    {data.applicant_category === 'employee' ? 'Employee' : 'Student'}
                                </p>
                            </div>

                            {data.applicant_category === 'student' ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {['department', 'level', 'course', 'section'].map((f) => (
                                        <Field key={f} id={f} label={f[0].toUpperCase() + f.slice(1)} error={errors[f]}>
                                            <input id={f} type="text" className={input} value={data[f]} onChange={(e) => setData(f, e.target.value)} />
                                        </Field>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field id="department" label="Department / Office" error={errors.department}>
                                        <input id="department" type="text" className={input} value={data.department} onChange={(e) => setData('department', e.target.value)} />
                                    </Field>
                                    <Field id="position" label="Position" error={errors.position}>
                                        <input id="position" type="text" className={input} value={data.position} onChange={(e) => setData('position', e.target.value)} />
                                    </Field>
                                </div>
                            )}

                            <div className="rounded-lg border border-border bg-surface-tertiary px-3 py-2 text-sm text-fg-secondary">
                                <span className="font-medium">{APPLICANT_TYPE_LABELS[applicantType] ?? applicantType}</span>
                                <span className="ml-2 text-xs text-fg-tertiary">Applicant type — from your account role</span>
                            </div>
                        </Section>

                        {/* Section B */}
                        <Section title="Section B — Study Information">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field id="respondents" label="Respondents" required error={errors.respondents}>
                                    <input id="respondents" type="text" className={input} value={data.respondents} onChange={(e) => setData('respondents', e.target.value)} required />
                                </Field>
                                <Field id="target_respondent_count" label="Target Number of Respondents" required error={errors.target_respondent_count}>
                                    <input id="target_respondent_count" type="number" min="1" className={input} value={data.target_respondent_count} onChange={(e) => setData('target_respondent_count', e.target.value)} required />
                                </Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <SelectWithOther id="data_collection_method" label="Data Collection Method"
                                    value={data.data_collection_method} otherValue={data.data_collection_method_other}
                                    onValueChange={(v) => setData('data_collection_method', v)} onOtherChange={(v) => setData('data_collection_method_other', v)}
                                    options={CHOICE_OPTIONS.data_collection_method} error={errors.data_collection_method} otherError={errors.data_collection_method_other} />
                                <SelectWithOther id="data_capturing_tool" label="Data Capturing Tool"
                                    value={data.data_capturing_tool} otherValue={data.data_capturing_tool_other}
                                    onValueChange={(v) => setData('data_capturing_tool', v)} onOtherChange={(v) => setData('data_capturing_tool_other', v)}
                                    options={CHOICE_OPTIONS.data_capturing_tool} error={errors.data_capturing_tool} otherError={errors.data_capturing_tool_other} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field id="target_start_date" label="Duration — Start" required error={errors.target_start_date}>
                                    <input id="target_start_date" type="date" className={input} value={data.target_start_date} onChange={(e) => setData('target_start_date', e.target.value)} required />
                                </Field>
                                <Field id="target_end_date" label="Duration — End" required error={errors.target_end_date}>
                                    <input id="target_end_date" type="date" className={input} value={data.target_end_date} onChange={(e) => setData('target_end_date', e.target.value)} required />
                                </Field>
                            </div>
                            <label className="flex items-start gap-3">
                                <input type="checkbox" checked={data.minors_involved} onChange={(e) => setData('minors_involved', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border-medium text-primary-700 focus:ring-4 focus:ring-primary-700/20" />
                                <span className="text-sm font-semibold text-fg-secondary">Will you have minors as participants?</span>
                            </label>
                            <label className="flex items-start gap-3">
                                <input type="checkbox" checked={data.respondent_head_letter_approved} onChange={(e) => setData('respondent_head_letter_approved', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border-medium text-primary-700 focus:ring-4 focus:ring-primary-700/20" />
                                <span className="text-sm font-semibold text-fg-secondary">Approved letter from head of target respondents on file?</span>
                            </label>
                        </Section>

                        {/* Review checklist */}
                        <Section title="Review Checklist">
                            <div className="divide-y divide-border">
                                {[
                                    { key: 'voluntary_participation', text: 'Will the study involve voluntary participation of all respondents?' },
                                    { key: 'confidentiality', text: "Will the participants' identities and responses remain confidential?" },
                                    { key: 'free_withdrawal', text: 'Will the participants be free to withdraw anytime without penalty?' },
                                    { key: 'avoid_harm', text: 'Will the study avoid exposing participants to harm or risk?' },
                                    { key: 'academic_use_only', text: 'Will the collected data be used strictly for academic purposes?' },
                                ].map((item) => (
                                    <div key={item.key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm font-semibold text-fg-secondary">{item.text}</p>
                                        <div className="flex shrink-0 gap-1.5">
                                            {[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_applicable', label: 'N/A' }].map((opt) => (
                                                <button key={opt.value} type="button" onClick={() => setChecklist(item.key, opt.value)}
                                                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-colors ${data.review_checklist[item.key] === opt.value ? 'border-primary-800 bg-primary-800 text-white' : 'border-border-medium text-fg-secondary hover:bg-surface-tertiary'}`}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* DPO Review Information */}
                        <Section title="DPO Review Information">
                            <Field id="purpose" label="Purpose of Data Collection" required error={errors.purpose}>
                                <textarea id="purpose" rows="3" className={input} value={data.purpose} onChange={(e) => setData('purpose', e.target.value)} required />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field id="data_types" label="Type of Personal Data Involved" required error={errors.data_types} hint="Comma-separated">
                                    <input id="data_types" type="text" className={input} value={data.data_types} onChange={(e) => setData('data_types', e.target.value)} required />
                                </Field>
                                <Field id="data_subjects" label="Data Subjects" required error={errors.data_subjects} hint="Comma-separated">
                                    <input id="data_subjects" type="text" className={input} value={data.data_subjects} onChange={(e) => setData('data_subjects', e.target.value)} required />
                                </Field>
                            </div>
                            <Field id="retention_plan" label="Data Storage/Retention Plan" required error={errors.retention_plan}>
                                <textarea id="retention_plan" rows="3" className={input} value={data.retention_plan} onChange={(e) => setData('retention_plan', e.target.value)} required />
                            </Field>
                            <label className="flex items-start gap-3">
                                <input type="checkbox" checked={data.third_party_sharing} onChange={(e) => setData('third_party_sharing', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border-medium text-primary-700 focus:ring-4 focus:ring-primary-700/20" />
                                <span className="text-sm font-semibold text-fg-secondary">Will data be shared with 3rd parties?</span>
                            </label>
                            {data.third_party_sharing && (
                                <Field id="third_party_detail" label="Third-Party Sharing Detail" error={errors.third_party_detail}>
                                    <textarea id="third_party_detail" rows="3" className={input} value={data.third_party_detail} onChange={(e) => setData('third_party_detail', e.target.value)} />
                                </Field>
                            )}
                        </Section>

                        {/* Re-sign (optional) */}
                        <Section title="Signature (optional re-sign)">
                            <p className="text-xs leading-relaxed text-fg-tertiary">
                                Leave blank to keep your existing signature. Signing again replaces it on the regenerated Form 1.
                            </p>
                            <SignaturePad onChange={(image) => setData('researcher_signature', image)} />
                            <InputError message={errors.researcher_signature} className="mt-2" />
                        </Section>

                        <div className="flex items-center justify-end gap-4">
                            <Link href={route('dpreq.show', application.id)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface-secondary px-5 text-sm font-bold text-fg-secondary shadow-sm hover:bg-surface-tertiary">Cancel</Link>
                            <button type="submit" disabled={processing} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-800 px-5 text-sm font-bold text-white shadow-lg shadow-primary-900/15 hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50">
                                <IconDeviceFloppy size={18} />
                                {processing ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Section({ title, children }) {
    return (
        <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
            <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">{title}</h2>
            </div>
            <div className="space-y-5 p-6">{children}</div>
        </section>
    );
}

function Field({ id, label, required = false, error, hint, children }) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-bold text-fg-secondary">
                {label} {required && <span className="text-red-600">*</span>}
            </label>
            {children}
            {hint && <p className="mt-1 text-xs text-fg-tertiary">{hint}</p>}
            <InputError message={error} className="mt-1.5" />
        </div>
    );
}
