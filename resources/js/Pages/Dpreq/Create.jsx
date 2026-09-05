import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import SignaturePad from '@/Components/SignaturePad';
import SelectWithOther from '@/Components/SelectWithOther';
import DocumentDropzone from '@/Components/DocumentDropzone';
import { Head, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconSend, IconShieldLock } from '@tabler/icons-react';
import { Link } from '@inertiajs/react';
import { notifyResultError } from '@/lib/confirm';

const formatMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// docs/1.1-dpreq-application-form.md — Form 1, the single intake shared by the DPO and Ethics
// tracks (docs/0.4-dpo-ethics-integration.md).
const APPLICANT_TYPE_LABELS = {
    internal_researcher: 'Internal Researcher',
    external_researcher: 'External Researcher',
    student: 'Student',
};

export default function Create({ documentSlots = [], fileLabels = [], uploadHint = '', applicantType = 'internal_researcher', applicantCategory = 'student', maxUploadBytes = 0, maxFileBytes = 0 }) {
    const { data, setData, post, transform, processing, errors } = useForm({
        research_title: '',
        research_category: 'academic',
        research_category_other: '',
        contact_number: '',
        researcher_count: 1,
        adviser_name: '',
        co_researchers: [],
        documents: {},
        additional_documents: [],
        applicant_category: applicantCategory,
        department: '',
        level: '',
        course: '',
        section: '',
        position: '',
        respondents: '',
        target_respondent_count: '',
        data_collection_method: 'survey_form',
        data_collection_method_other: '',
        data_capturing_tool: 'electronic_form',
        data_capturing_tool_other: '',
        target_start_date: '',
        target_end_date: '',
        minors_involved: false,
        respondent_head_letter_approved: false,
        researcher_signature: null,
        review_checklist: {
            voluntary_participation: 'yes',
            confidentiality: 'yes',
            free_withdrawal: 'yes',
            avoid_harm: 'yes',
            academic_use_only: 'yes',
        },
        applicant_type: applicantType,
        purpose: '',
        data_types: '',
        data_subjects: '',
        retention_plan: '',
        third_party_sharing: false,
        third_party_detail: '',

        // docs/3.1 Sections C/D (Ethics track — docs/0.4)
        study_type: 'thesis_dissertation',
        study_type_other: '',
        study_design: 'quantitative',
        study_design_other: '',
        study_sites: '',
        funding_source: '',
        target_population: '',
        participant_count: '',
        inclusion_criteria: '',
        exclusion_criteria: '',
        vulnerable_population: false,
        risks_to_participants: '',
        benefits: '',
        confidentiality_measures: '',
        consent_process: '',
        data_storage_plan: '',

        // Unified Form 1, Parts II–V (reqs/ July-7-2026 PDF, resolution B1 2026-08-31)
        funding_source_type: '',
        funding_source_type_other: '',
        recruitment_method: '',
        target_participants: [],
        ethics_checklist: {
            informed_consent: 'yes',
            voluntary_participation: 'yes',
            free_withdrawal: 'yes',
            risks_minimized: 'yes',
            confidentiality_protected: 'yes',
            vulnerable_populations: 'no',
            incentives_provided: 'no',
            deception_involved: 'no',
        },
        risk_band: 'minimal',
        risk_band_explanation: '',
        data_classification: 'personal_information',
        data_storage_method: '',
        data_access_persons: '',
        data_retention_period: '',
        data_disposal_method: '',
    });

    // Document slots split by requirement, for the upload section below.
    const mandatorySlots = documentSlots.filter((s) => s.requirement === 'mandatory');
    const conditionalSlots = documentSlots.filter((s) => s.requirement === 'minors');
    const optionalSlots = documentSlots.filter((s) => s.requirement === 'optional');

    // Each slot accepts one or more files (stakeholder 2026-07-28). Files are ADDED to the slot's
    // list (never overwritten) so choosing files again appends; each file can be removed
    // individually. The payload posts documents[key][] and the server validates each as a file.
    const addDocumentFiles = (key, fileList) =>
        setData('documents', {
            ...data.documents,
            [key]: [...(data.documents[key] ?? []), ...Array.from(fileList ?? [])],
        });
    const removeDocumentFile = (key, index) =>
        setData('documents', {
            ...data.documents,
            [key]: (data.documents[key] ?? []).filter((_, i) => i !== index),
        });

    const setChecklist = (key, value) =>
        setData('review_checklist', { ...data.review_checklist, [key]: value });

    // Unified Form 1 (resolution B1) — Part III participant checkboxes and Part IV ethics items.
    const PARTICIPANT_OPTIONS = [
        { value: 'students', label: 'Students' },
        { value: 'employees', label: 'Employees' },
        { value: 'faculty', label: 'Faculty' },
        { value: 'parents', label: 'Parents' },
        { value: 'community_members', label: 'Community Members' },
        { value: 'minors', label: 'Minors' },
        { value: 'vulnerable_groups', label: 'Vulnerable Groups' },
        { value: 'others', label: 'Others' },
    ];
    const ETHICS_ITEMS = [
        { key: 'informed_consent', label: 'Informed consent will be secured' },
        { key: 'voluntary_participation', label: 'Participation is voluntary' },
        { key: 'free_withdrawal', label: 'Participants may withdraw at any time' },
        { key: 'risks_minimized', label: 'Risks to participants are minimized' },
        { key: 'confidentiality_protected', label: 'Confidentiality will be protected' },
        { key: 'vulnerable_populations', label: 'Vulnerable populations are involved' },
        { key: 'incentives_provided', label: 'Incentives/compensation will be provided' },
        { key: 'deception_involved', label: 'Deception is involved' },
    ];
    const toggleParticipant = (value) =>
        setData('target_participants', data.target_participants.includes(value)
            ? data.target_participants.filter((v) => v !== value)
            : [...data.target_participants, value]);
    const setEthicsItem = (key, value) =>
        setData('ethics_checklist', { ...data.ethics_checklist, [key]: value });

    // B2 (concern 3.1) — the researcher count and the co-researcher roster stay in sync: the count
    // is the whole team (lead + co-researchers), so there are always count − 1 co-researcher rows.
    const syncResearcherCount = (raw) => {
        const n = Math.max(1, parseInt(raw, 10) || 1);
        setData((prev) => {
            const target = n - 1;
            const rows = prev.co_researchers.slice(0, target);
            while (rows.length < target) rows.push({ full_name: '', email: '' });
            return { ...prev, researcher_count: n, co_researchers: rows };
        });
    };
    const addCoResearcher = () => setData((prev) => ({
        ...prev,
        co_researchers: [...prev.co_researchers, { full_name: '', email: '' }],
        researcher_count: prev.co_researchers.length + 2, // new member + the lead applicant
    }));
    const updateCoResearcher = (i, field, value) => setData((prev) => ({
        ...prev,
        co_researchers: prev.co_researchers.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)),
    }));
    const removeCoResearcher = (i) => setData((prev) => {
        const co = prev.co_researchers.filter((_, idx) => idx !== i);
        return { ...prev, co_researchers: co, researcher_count: co.length + 1 };
    });

    const addAdditional = () => setData('additional_documents', [...data.additional_documents, { label: fileLabels[0] ?? 'OTHERDOCUMENT', file: null }]);
    const updateAdditional = (i, field, value) => setData('additional_documents', data.additional_documents.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
    const removeAdditional = (i) => setData('additional_documents', data.additional_documents.filter((_, idx) => idx !== i));

    const submit = (e) => {
        e.preventDefault();

        // Reject any single file over the per-file cap up front, with a clear message. Otherwise PHP
        // rejects an over-cap file mid-upload with a bare "…failed to upload" — it fires before
        // validation once a file exceeds upload_max_filesize, so the applicant can't tell it's a
        // size problem.
        const oversized = [];
        Object.values(data.documents ?? {})
            .flat()
            .forEach((file) => {
                if (file && maxFileBytes > 0 && file.size > maxFileBytes) oversized.push(file.name);
            });
        (data.additional_documents ?? []).forEach((doc) => {
            if (doc?.file && maxFileBytes > 0 && doc.file.size > maxFileBytes) oversized.push(doc.file.name);
        });
        if (oversized.length > 0) {
            notifyResultError(
                'File too large',
                `${oversized.length === 1 ? 'This file exceeds' : 'These files exceed'} the ${formatMB(maxFileBytes)} per-file limit: ${oversized.join(', ')}. Please compress or reduce ${oversized.length === 1 ? 'it' : 'them'}, then try again.`,
            );
            return;
        }

        // Fail fast if the attachments would blow past the server's POST ceiling. Uploading first and
        // letting PHP reject the request means a long wait ending in an opaque "POST too long" (413),
        // with the loader closing but the button stuck on "Submitting…". Catch it here instead.
        const attachmentBytes =
            Object.values(data.documents ?? {})
                .flat()
                .reduce((sum, file) => sum + (file?.size ?? 0), 0)
            + (data.additional_documents ?? []).reduce((sum, doc) => sum + (doc?.file?.size ?? 0), 0);

        // Leave ~10% headroom for the other form fields, the signature image, and multipart overhead.
        if (maxUploadBytes > 0 && attachmentBytes > maxUploadBytes * 0.9) {
            notifyResultError(
                'Attachments too large',
                `Your attachments total about ${formatMB(attachmentBytes)}, but this server accepts up to about ${formatMB(maxUploadBytes)} per submission. Please compress or split the largest files and try again.`,
            );
            return;
        }

        transform((formData) => {
            // Drop co-researcher rows the user added but left blank/whitespace — treat them as
            // accidental empty rows, and keep the researcher count in step (lead + real members).
            const coResearchers = (formData.co_researchers ?? []).filter(
                (m) => (m.full_name ?? '').trim() !== '' || (m.email ?? '').trim() !== '',
            );
            return {
                ...formData,
                co_researchers: coResearchers,
                researcher_count: coResearchers.length + 1,
                data_types: formData.data_types
                    ? formData.data_types.split(',').map((s) => s.trim()).filter(Boolean)
                    : [],
                data_subjects: formData.data_subjects
                    ? formData.data_subjects.split(',').map((s) => s.trim()).filter(Boolean)
                    : [],
            };
        });
        // forceFormData: the payload carries uploaded files (documents + additional_documents).
        post(route('dpreq.store'), {
            forceFormData: true,
            // The form is long and spans several sections — on a validation failure, bring the
            // summary of what's missing into view so the submit never looks like it "did nothing".
            onError: () => {
                requestAnimationFrame(() =>
                    document.getElementById('dpreq-error-summary')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
                );
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="New DPREQ Application" />

            <div className="px-5 py-8 font-grotesk text-fg-primary sm:px-8 lg:px-12 lg:py-10">
                <div className="mx-auto max-w-[90rem]">

                    {/* Header */}
                    <section className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row">
                        <div className="flex items-start gap-3.5">
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-primary-800 text-white shadow-lg shadow-primary-900/20">
                                <IconShieldLock size={22} />
                            </span>

                            <div>
                                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.11em] text-primary-700">
                                    Privacy operations
                                </p>

                                <h1 className="text-3xl font-extrabold leading-none tracking-[-0.045em] lg:text-5xl">
                                    New application
                                </h1>

                                <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-fg-secondary">
                                    Form 1 — Shared intake for the DPO and Ethics review tracks.
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('dpreq.index')}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface-secondary px-4 text-sm font-bold text-fg-secondary shadow-sm hover:bg-surface-tertiary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20"
                        >
                            <IconArrowLeft size={18} />
                            Back to list
                        </Link>
                    </section>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-8">

                        {/* Validation summary — this form is long; surface every problem up front
                            so a failed submit is never silent. */}
                        {Object.keys(errors).length > 0 && (
                            <div id="dpreq-error-summary" className="rounded-xl border border-danger/40 bg-danger-bg px-5 py-4">
                                <p className="text-sm font-bold text-danger-text">
                                    Please fix {Object.keys(errors).length} {Object.keys(errors).length === 1 ? 'problem' : 'problems'} before submitting:
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger-text/90">
                                    {Object.entries(errors).map(([key, message]) => (
                                        <li key={key}>{message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Section A - Applicant Information */}
                        <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                            <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Section A — Applicant Information
                                </h2>
                            </div>

                            <div className="space-y-5 p-6">
                                <div>
                                    <label htmlFor="research_title" className="block text-xs font-bold text-fg-secondary">
                                        Research Title <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        id="research_title"
                                        type="text"
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.research_title}
                                        onChange={(e) => setData('research_title', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.research_title} className="mt-1.5" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="researcher_count" className="block text-xs font-bold text-fg-secondary">
                                            How many are doing the research? <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="researcher_count"
                                            type="number"
                                            min="1"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.researcher_count}
                                            onChange={(e) => syncResearcherCount(e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-xs text-fg-tertiary">Includes you. We'll add {Math.max(0, data.researcher_count - 1)} co-researcher {data.researcher_count - 1 === 1 ? 'row' : 'rows'} below.</p>
                                        <InputError message={errors.researcher_count} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="adviser_name" className="block text-xs font-bold text-fg-secondary">
                                            Adviser's Name <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="adviser_name"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.adviser_name}
                                            onChange={(e) => setData('adviser_name', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.adviser_name} className="mt-1.5" />
                                    </div>
                                </div>

                                {/* Student/employee is fixed on the account at creation, so it's shown
                                    read-only here rather than asked (2026-09-05). The form still adapts:
                                    students give level/course/section, employees give a position. */}
                                <div>
                                    <span className="block text-xs font-bold text-fg-secondary">Filing as</span>
                                    <p className="mt-1.5 inline-flex items-center rounded-lg border border-border-medium bg-surface-tertiary/50 px-3 py-1.5 text-sm font-semibold text-fg-secondary">
                                        {data.applicant_category === 'employee' ? 'Employee' : 'Student'}
                                    </p>
                                </div>

                                {data.applicant_category === 'student' ? (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        {['department', 'level', 'course', 'section'].map((field) => (
                                            <div key={field}>
                                                <label htmlFor={field} className="block text-xs font-bold text-fg-secondary">
                                                    {field[0].toUpperCase() + field.slice(1)}
                                                </label>
                                                <input
                                                    id={field}
                                                    type="text"
                                                    className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                                    value={data[field]}
                                                    onChange={(e) => setData(field, e.target.value)}
                                                />
                                                <InputError message={errors[field]} className="mt-1.5" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="department" className="block text-xs font-bold text-fg-secondary">
                                                Department / Office
                                            </label>
                                            <input
                                                id="department"
                                                type="text"
                                                className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                                value={data.department}
                                                onChange={(e) => setData('department', e.target.value)}
                                            />
                                            <InputError message={errors.department} className="mt-1.5" />
                                        </div>
                                        <div>
                                            <label htmlFor="position" className="block text-xs font-bold text-fg-secondary">
                                                Position
                                            </label>
                                            <input
                                                id="position"
                                                type="text"
                                                className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                                value={data.position}
                                                onChange={(e) => setData('position', e.target.value)}
                                            />
                                            <InputError message={errors.position} className="mt-1.5" />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-fg-secondary">
                                        Applicant Type
                                    </label>
                                    {/* B4 — derived from your account role, not editable. */}
                                    <div className="mt-1.5 flex items-center justify-between rounded-lg border border-border bg-surface-tertiary px-3 py-2 text-sm text-fg-secondary">
                                        <span className="font-medium">{APPLICANT_TYPE_LABELS[applicantType] ?? applicantType}</span>
                                        <span className="text-xs text-fg-tertiary">From your account role</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section B - Study Information */}
                        <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                            <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Section B — Study Information
                                </h2>
                            </div>

                            <div className="space-y-5 p-6">

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="respondents" className="block text-xs font-bold text-fg-secondary">
                                            Respondents <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="respondents"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.respondents}
                                            onChange={(e) => setData('respondents', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.respondents} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="target_respondent_count" className="block text-xs font-bold text-fg-secondary">
                                            Target Number of Respondents <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="target_respondent_count"
                                            type="number"
                                            min="1"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.target_respondent_count}
                                            onChange={(e) => setData('target_respondent_count', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.target_respondent_count} className="mt-1.5" />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <SelectWithOther
                                        id="data_collection_method"
                                        label="Data Collection Method"
                                        value={data.data_collection_method}
                                        otherValue={data.data_collection_method_other}
                                        onValueChange={(v) => setData('data_collection_method', v)}
                                        onOtherChange={(v) => setData('data_collection_method_other', v)}
                                        options={[
                                            { value: 'survey_form', label: 'Survey form' },
                                            { value: 'interview', label: 'Interview' },
                                            { value: 'mixed', label: 'Mixed' },
                                            { value: 'observation', label: 'Observation' },
                                        ]}
                                        error={errors.data_collection_method}
                                        otherError={errors.data_collection_method_other}
                                    />
                                    <SelectWithOther
                                        id="data_capturing_tool"
                                        label="Data Capturing Tool"
                                        value={data.data_capturing_tool}
                                        otherValue={data.data_capturing_tool_other}
                                        onValueChange={(v) => setData('data_capturing_tool', v)}
                                        onOtherChange={(v) => setData('data_capturing_tool_other', v)}
                                        options={[
                                            { value: 'electronic_form', label: 'Electronic form' },
                                            { value: 'paper_based', label: 'Paper-based' },
                                            { value: 'voice_recording', label: 'Voice recording' },
                                            { value: 'video_recording', label: 'Video recording' },
                                        ]}
                                        error={errors.data_capturing_tool}
                                        otherError={errors.data_capturing_tool_other}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="target_start_date" className="block text-xs font-bold text-fg-secondary">
                                            Duration — Start <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="target_start_date"
                                            type="date"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.target_start_date}
                                            onChange={(e) => setData('target_start_date', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.target_start_date} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="target_end_date" className="block text-xs font-bold text-fg-secondary">
                                            Duration — End <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="target_end_date"
                                            type="date"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.target_end_date}
                                            onChange={(e) => setData('target_end_date', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.target_end_date} className="mt-1.5" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-start gap-3">
                                        <input
                                            id="minors_involved"
                                            type="checkbox"
                                            checked={data.minors_involved}
                                            onChange={(e) => setData('minors_involved', e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-border-medium text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                        />
                                        <span className="text-sm font-semibold text-fg-secondary">
                                            Will you have minors as participants?
                                        </span>
                                    </label>

                                    <label className="flex items-start gap-3">
                                        <input
                                            id="respondent_head_letter_approved"
                                            type="checkbox"
                                            checked={data.respondent_head_letter_approved}
                                            onChange={(e) => setData('respondent_head_letter_approved', e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-border-medium text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                        />
                                        <span className="text-sm font-semibold text-fg-secondary">
                                            Approved letter from head of target respondents on file?
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* Unified Form 1 additions — Parts II–V (reqs/ July-7-2026 PDF, resolution
                            B1 2026-08-31). Optional structured intake collected alongside the
                            confirmed Form 1 fields above. */}
                        <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                            <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Participants, Ethics &amp; Data Privacy Plan
                                </h2>
                                <p className="mt-1 text-xs text-fg-tertiary">
                                    Unified application form, Parts II–V. Optional but recommended — reviewers use these to classify your study.
                                </p>
                            </div>

                            <div className="space-y-6 p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <SelectWithOther
                                        id="funding_source_type"
                                        label="Funding Source"
                                        value={data.funding_source_type}
                                        otherValue={data.funding_source_type_other}
                                        onValueChange={(v) => setData('funding_source_type', v)}
                                        onOtherChange={(v) => setData('funding_source_type_other', v)}
                                        options={[
                                            { value: 'self_funded', label: 'Self-funded' },
                                            { value: 'university_funded', label: 'University-funded' },
                                            { value: 'externally_funded', label: 'Externally funded' },
                                        ]}
                                        error={errors.funding_source_type}
                                        otherError={errors.funding_source_type_other}
                                    />
                                    <div>
                                        <label htmlFor="recruitment_method" className="block text-xs font-bold text-fg-secondary">
                                            Recruitment Method
                                        </label>
                                        <input
                                            id="recruitment_method"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            placeholder="e.g. class announcements, purposive sampling"
                                            value={data.recruitment_method}
                                            onChange={(e) => setData('recruitment_method', e.target.value)}
                                        />
                                        <InputError message={errors.recruitment_method} className="mt-1.5" />
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-bold text-fg-secondary">Target Participants</p>
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                        {PARTICIPANT_OPTIONS.map((opt) => (
                                            <label key={opt.value} className="flex items-center gap-2 text-sm text-fg-secondary">
                                                <input
                                                    type="checkbox"
                                                    checked={data.target_participants.includes(opt.value)}
                                                    onChange={() => toggleParticipant(opt.value)}
                                                    className="h-4 w-4 rounded border-border-medium text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                                />
                                                {opt.label}
                                            </label>
                                        ))}
                                    </div>
                                    <InputError message={errors.target_participants} className="mt-1.5" />
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-bold text-fg-secondary">
                                        Ethical Considerations Checklist
                                    </p>
                                    <div className="overflow-hidden rounded-lg border border-border-medium">
                                        {ETHICS_ITEMS.map((item, i) => (
                                            <div
                                                key={item.key}
                                                className={`flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between ${i % 2 ? 'bg-surface-tertiary/50' : ''}`}
                                            >
                                                <span className="text-sm text-fg-secondary">{item.label}</span>
                                                <div className="flex gap-4">
                                                    {['yes', 'no', 'not_applicable'].map((opt) => (
                                                        <label key={opt} className="flex items-center gap-1.5 text-xs text-fg-secondary">
                                                            <input
                                                                type="radio"
                                                                name={`ethics_${item.key}`}
                                                                checked={data.ethics_checklist[item.key] === opt}
                                                                onChange={() => setEthicsItem(item.key, opt)}
                                                                className="h-3.5 w-3.5 border-border-medium text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                                            />
                                                            {opt === 'not_applicable' ? 'N/A' : opt.toUpperCase()}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <InputError message={errors.ethics_checklist} className="mt-1.5" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="mb-2 text-xs font-bold text-fg-secondary">Potential Risks to Participants</p>
                                        <div className="flex flex-wrap gap-3">
                                            {['none', 'minimal', 'moderate', 'high'].map((band) => (
                                                <label key={band} className="flex items-center gap-1.5 text-sm capitalize text-fg-secondary">
                                                    <input
                                                        type="radio"
                                                        name="risk_band"
                                                        checked={data.risk_band === band}
                                                        onChange={() => setData('risk_band', band)}
                                                        className="h-4 w-4 border-border-medium text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                                    />
                                                    {band}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError message={errors.risk_band} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="data_classification" className="block text-xs font-bold text-fg-secondary">
                                            Classification of Data (Data Privacy Act)
                                        </label>
                                        <select
                                            id="data_classification"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.data_classification}
                                            onChange={(e) => setData('data_classification', e.target.value)}
                                        >
                                            <option value="non_personal">Non-Personal Data</option>
                                            <option value="personal_information">Personal Information</option>
                                            <option value="sensitive_personal_information">Sensitive Personal Information</option>
                                            <option value="privileged_information">Privileged Information</option>
                                        </select>
                                        <InputError message={errors.data_classification} className="mt-1.5" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="risk_band_explanation" className="block text-xs font-bold text-fg-secondary">
                                        Explain the risks (and how they are minimized)
                                    </label>
                                    <textarea
                                        id="risk_band_explanation"
                                        rows={2}
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.risk_band_explanation}
                                        onChange={(e) => setData('risk_band_explanation', e.target.value)}
                                    />
                                    <InputError message={errors.risk_band_explanation} className="mt-1.5" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="data_storage_method" className="block text-xs font-bold text-fg-secondary">
                                            Storage Method
                                        </label>
                                        <input
                                            id="data_storage_method"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            placeholder="e.g. password-protected computer"
                                            value={data.data_storage_method}
                                            onChange={(e) => setData('data_storage_method', e.target.value)}
                                        />
                                        <InputError message={errors.data_storage_method} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="data_access_persons" className="block text-xs font-bold text-fg-secondary">
                                            Persons with Access to Data
                                        </label>
                                        <input
                                            id="data_access_persons"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            placeholder="e.g. researcher and adviser only"
                                            value={data.data_access_persons}
                                            onChange={(e) => setData('data_access_persons', e.target.value)}
                                        />
                                        <InputError message={errors.data_access_persons} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="data_retention_period" className="block text-xs font-bold text-fg-secondary">
                                            Data Retention Period
                                        </label>
                                        <input
                                            id="data_retention_period"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            placeholder="e.g. 1 year after completion"
                                            value={data.data_retention_period}
                                            onChange={(e) => setData('data_retention_period', e.target.value)}
                                        />
                                        <InputError message={errors.data_retention_period} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="data_disposal_method" className="block text-xs font-bold text-fg-secondary">
                                            Disposal Method
                                        </label>
                                        <input
                                            id="data_disposal_method"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            placeholder="e.g. secure deletion, shredding"
                                            value={data.data_disposal_method}
                                            onChange={(e) => setData('data_disposal_method', e.target.value)}
                                        />
                                        <InputError message={errors.data_disposal_method} className="mt-1.5" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Review Checklist — Form 1 items 3–7 (docs/1.1). Answered here so they no
                            longer print blank on the generated Form 1. */}
                        <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                            <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Review Checklist
                                </h2>
                                <p className="mt-1.5 text-xs leading-relaxed text-fg-tertiary">
                                    Please answer each item about how your study treats its participants.
                                </p>
                            </div>

                            <div className="divide-y divide-border">
                                {[
                                    { key: 'voluntary_participation', text: 'Will the study involve voluntary participation of all respondents?' },
                                    { key: 'confidentiality', text: "Will the participants' identities and responses remain confidential?" },
                                    { key: 'free_withdrawal', text: 'Will the participants be free to withdraw anytime without penalty?' },
                                    { key: 'avoid_harm', text: 'Will the study avoid exposing participants to harm or risk?' },
                                    { key: 'academic_use_only', text: 'Will the collected data be used strictly for academic purposes?' },
                                ].map((item) => (
                                    <div key={item.key} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm font-semibold text-fg-secondary">{item.text}</p>
                                        <div className="flex shrink-0 gap-1.5">
                                            {[
                                                { value: 'yes', label: 'Yes' },
                                                { value: 'no', label: 'No' },
                                                { value: 'not_applicable', label: 'N/A' },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setChecklist(item.key, opt.value)}
                                                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                                        data.review_checklist[item.key] === opt.value
                                                            ? 'border-primary-800 bg-primary-800 text-white'
                                                            : 'border-border-medium text-fg-secondary hover:bg-surface-tertiary'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <InputError message={errors.review_checklist} className="px-6 pb-4" />
                        </section>

                        {/* DPO Review Information */}
                        <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                            <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    DPO Review Information
                                </h2>
                            </div>

                            <div className="space-y-5 p-6">
                                <div>
                                    <label htmlFor="purpose" className="block text-xs font-bold text-fg-secondary">
                                        Purpose of Data Collection <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="purpose"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.purpose}
                                        onChange={(e) => setData('purpose', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.purpose} className="mt-1.5" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="data_types" className="block text-xs font-bold text-fg-secondary">
                                            Type of Personal Data Involved <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="data_types"
                                            type="text"
                                            placeholder="Name, Contact Info, Academic Records"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.data_types}
                                            onChange={(e) => setData('data_types', e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-xs text-fg-tertiary">Comma-separated</p>
                                        <InputError message={errors.data_types} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="data_subjects" className="block text-xs font-bold text-fg-secondary">
                                            Data Subjects <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="data_subjects"
                                            type="text"
                                            placeholder="Students, Employees"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.data_subjects}
                                            onChange={(e) => setData('data_subjects', e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-xs text-fg-tertiary">Comma-separated</p>
                                        <InputError message={errors.data_subjects} className="mt-1.5" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="retention_plan" className="block text-xs font-bold text-fg-secondary">
                                        Data Storage/Retention Plan <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="retention_plan"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.retention_plan}
                                        onChange={(e) => setData('retention_plan', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.retention_plan} className="mt-1.5" />
                                </div>

                                <div>
                                    <label className="flex items-start gap-3">
                                        <input
                                            id="third_party_sharing"
                                            type="checkbox"
                                            checked={data.third_party_sharing}
                                            onChange={(e) => setData('third_party_sharing', e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-border-medium text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                        />
                                        <span className="text-sm font-semibold text-fg-secondary">
                                            Will data be shared with 3rd parties?
                                        </span>
                                    </label>
                                </div>

                                {data.third_party_sharing && (
                                    <div>
                                        <label htmlFor="third_party_detail" className="block text-xs font-bold text-fg-secondary">
                                            Third-Party Sharing Detail
                                        </label>
                                        <textarea
                                            id="third_party_detail"
                                            rows="3"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.third_party_detail}
                                            onChange={(e) => setData('third_party_detail', e.target.value)}
                                        />
                                        <InputError message={errors.third_party_detail} className="mt-1.5" />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Ethics Review Information */}
                        <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                            <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Ethics Review Information
                                </h2>
                                <p className="mt-1.5 text-xs leading-relaxed text-fg-tertiary">
                                    Required for the Ethics/REMIS track — not shown on Form 1 itself, but collected here since one submission starts both tracks.
                                </p>
                            </div>

                            <div className="space-y-5 p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <SelectWithOther
                                        id="study_type"
                                        label="Study Type"
                                        value={data.study_type}
                                        otherValue={data.study_type_other}
                                        onValueChange={(v) => setData('study_type', v)}
                                        onOtherChange={(v) => setData('study_type_other', v)}
                                        options={[
                                            { value: 'thesis_dissertation', label: 'Thesis/Dissertation' },
                                            { value: 'faculty_research', label: 'Faculty Research' },
                                            { value: 'institutional', label: 'Institutional' },
                                            { value: 'sponsored', label: 'Sponsored' },
                                        ]}
                                        error={errors.study_type}
                                        otherError={errors.study_type_other}
                                    />
                                    <SelectWithOther
                                        id="study_design"
                                        label="Study Design"
                                        value={data.study_design}
                                        otherValue={data.study_design_other}
                                        onValueChange={(v) => setData('study_design', v)}
                                        onOtherChange={(v) => setData('study_design_other', v)}
                                        options={[
                                            { value: 'quantitative', label: 'Quantitative' },
                                            { value: 'qualitative', label: 'Qualitative' },
                                            { value: 'mixed_methods', label: 'Mixed Methods' },
                                        ]}
                                        error={errors.study_design}
                                        otherError={errors.study_design_other}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="study_sites" className="block text-xs font-bold text-fg-secondary">
                                            Study Site(s) <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="study_sites"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.study_sites}
                                            onChange={(e) => setData('study_sites', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.study_sites} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="funding_source" className="block text-xs font-bold text-fg-secondary">
                                            Funding Source
                                        </label>
                                        <input
                                            id="funding_source"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.funding_source}
                                            onChange={(e) => setData('funding_source', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="target_population" className="block text-xs font-bold text-fg-secondary">
                                        Target Population <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="target_population"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.target_population}
                                        onChange={(e) => setData('target_population', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.target_population} className="mt-1.5" />
                                </div>

                                <div>
                                    <label htmlFor="participant_count" className="block text-xs font-bold text-fg-secondary">
                                        Number of Participants <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        id="participant_count"
                                        type="number"
                                        min="1"
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.participant_count}
                                        onChange={(e) => setData('participant_count', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.participant_count} className="mt-1.5" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="inclusion_criteria" className="block text-xs font-bold text-fg-secondary">
                                            Inclusion Criteria <span className="text-red-600">*</span>
                                        </label>
                                        <textarea
                                            id="inclusion_criteria"
                                            rows="3"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.inclusion_criteria}
                                            onChange={(e) => setData('inclusion_criteria', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.inclusion_criteria} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="exclusion_criteria" className="block text-xs font-bold text-fg-secondary">
                                            Exclusion Criteria <span className="text-red-600">*</span>
                                        </label>
                                        <textarea
                                            id="exclusion_criteria"
                                            rows="3"
                                            className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.exclusion_criteria}
                                            onChange={(e) => setData('exclusion_criteria', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.exclusion_criteria} className="mt-1.5" />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-start gap-3">
                                        <input
                                            id="vulnerable_population"
                                            type="checkbox"
                                            checked={data.vulnerable_population}
                                            onChange={(e) => setData('vulnerable_population', e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-border-medium text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                        />
                                        <span className="text-sm font-semibold text-fg-secondary">
                                            Does the study involve a vulnerable population?
                                        </span>
                                    </label>
                                </div>

                                <div>
                                    <label htmlFor="risks_to_participants" className="block text-xs font-bold text-fg-secondary">
                                        Risks to Participants <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="risks_to_participants"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.risks_to_participants}
                                        onChange={(e) => setData('risks_to_participants', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.risks_to_participants} className="mt-1.5" />
                                </div>

                                <div>
                                    <label htmlFor="benefits" className="block text-xs font-bold text-fg-secondary">
                                        Benefits <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="benefits"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.benefits}
                                        onChange={(e) => setData('benefits', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.benefits} className="mt-1.5" />
                                </div>

                                <div>
                                    <label htmlFor="confidentiality_measures" className="block text-xs font-bold text-fg-secondary">
                                        Confidentiality Measures <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="confidentiality_measures"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.confidentiality_measures}
                                        onChange={(e) => setData('confidentiality_measures', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.confidentiality_measures} className="mt-1.5" />
                                </div>

                                <div>
                                    <label htmlFor="consent_process" className="block text-xs font-bold text-fg-secondary">
                                        Consent Process <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="consent_process"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.consent_process}
                                        onChange={(e) => setData('consent_process', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.consent_process} className="mt-1.5" />
                                </div>

                                <div>
                                    <label htmlFor="data_storage_plan" className="block text-xs font-bold text-fg-secondary">
                                        Data Storage Plan (Ethics) <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="data_storage_plan"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.data_storage_plan}
                                        onChange={(e) => setData('data_storage_plan', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.data_storage_plan} className="mt-1.5" />
                                </div>
                            </div>
                        </section>

                        {/* Section C - Research Team & Category */}
                        <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                            <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Section C — Research Team &amp; Category
                                </h2>
                            </div>
                            <div className="grid gap-5 p-6 sm:grid-cols-2">
                                <SelectWithOther
                                    id="research_category"
                                    label="Research Category"
                                    value={data.research_category}
                                    otherValue={data.research_category_other}
                                    onValueChange={(v) => setData('research_category', v)}
                                    onOtherChange={(v) => setData('research_category_other', v)}
                                    options={[
                                        { value: 'academic', label: 'Academic' },
                                        { value: 'student_thesis', label: 'Student Thesis / Dissertation' },
                                        { value: 'faculty', label: 'Faculty Research' },
                                        { value: 'institutional', label: 'Institutional' },
                                        { value: 'sponsored', label: 'Sponsored' },
                                    ]}
                                    error={errors.research_category}
                                    otherError={errors.research_category_other}
                                />
                                <div>
                                    <label htmlFor="contact_number" className="mb-1.5 block text-sm font-bold text-fg-primary">Contact Number <span className="font-normal text-fg-tertiary">(optional)</span></label>
                                    <input
                                        id="contact_number"
                                        type="text"
                                        value={data.contact_number}
                                        onChange={(e) => setData('contact_number', e.target.value)}
                                        className="block w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                                    />
                                    <InputError message={errors.contact_number} className="mt-1.5" />
                                </div>

                                <div className="sm:col-span-2">
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-sm font-bold text-fg-primary">Co-Researchers</label>
                                        <button type="button" onClick={addCoResearcher} className="text-xs font-bold text-primary-700 hover:underline">+ Add member</button>
                                    </div>
                                    <p className="mb-3 text-xs text-fg-tertiary">
                                        Each co-researcher is emailed a personal link to sign the team Non-Disclosure Agreement. Leave empty if you're the sole researcher.
                                    </p>
                                    {data.co_researchers.length === 0 && (
                                        <p className="rounded-lg bg-surface-tertiary px-3 py-3 text-xs text-fg-tertiary ring-1 ring-inset ring-border">No co-researchers added.</p>
                                    )}
                                    <div className="space-y-2">
                                        {data.co_researchers.map((m, i) => (
                                            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                                                <input
                                                    type="text" placeholder="Full name" value={m.full_name}
                                                    onChange={(e) => updateCoResearcher(i, 'full_name', e.target.value)}
                                                    className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                                                />
                                                <input
                                                    type="email" placeholder="Email" value={m.email}
                                                    onChange={(e) => updateCoResearcher(i, 'email', e.target.value)}
                                                    className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                                                />
                                                <button type="button" onClick={() => removeCoResearcher(i)} className="rounded-lg border border-border px-3 text-xs font-bold text-red-600 hover:bg-red-50">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                    <InputError message={errors.co_researchers} className="mt-1.5" />
                                </div>
                            </div>
                        </section>

                        {/* Section D - Supporting Documents */}
                        <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                            <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Section D — Supporting Documents
                                </h2>
                                <p className="mt-1 text-xs text-fg-tertiary">{uploadHint}</p>
                            </div>
                            <div className="space-y-7 p-6">
                                <div>
                                    <p className="mb-3 text-sm font-bold text-fg-primary">Required <span className="text-red-600">*</span></p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {mandatorySlots.map((slot) => (
                                            <DocumentDropzone key={slot.key} title={slot.title} badge="Required" files={data.documents[slot.key] ?? []} onAdd={(fl) => addDocumentFiles(slot.key, fl)} onRemove={(i) => removeDocumentFile(slot.key, i)} error={errors[`documents.${slot.key}`]} />
                                        ))}
                                    </div>
                                </div>

                                {data.minors_involved && (
                                    <div>
                                        <p className="mb-3 text-sm font-bold text-fg-primary">Required (minors involved) <span className="text-red-600">*</span></p>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {conditionalSlots.map((slot) => (
                                                <DocumentDropzone key={slot.key} title={slot.title} badge="Required" files={data.documents[slot.key] ?? []} onAdd={(fl) => addDocumentFiles(slot.key, fl)} onRemove={(i) => removeDocumentFile(slot.key, i)} error={errors[`documents.${slot.key}`]} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className="mb-3 text-sm font-bold text-fg-primary">As applicable <span className="font-normal text-fg-tertiary">(optional)</span></p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {optionalSlots.map((slot) => (
                                            <DocumentDropzone key={slot.key} title={slot.title} badge="Optional" files={data.documents[slot.key] ?? []} onAdd={(fl) => addDocumentFiles(slot.key, fl)} onRemove={(i) => removeDocumentFile(slot.key, i)} error={errors[`documents.${slot.key}`]} />
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-border pt-5">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-sm font-bold text-fg-primary">Additional documents</p>
                                        <button type="button" onClick={addAdditional} className="text-xs font-bold text-primary-700 hover:underline">+ Add document</button>
                                    </div>
                                    <div className="space-y-2">
                                        {data.additional_documents.map((d, i) => (
                                            <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
                                                <select
                                                    value={d.label}
                                                    onChange={(e) => updateAdditional(i, 'label', e.target.value)}
                                                    className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                                                >
                                                    {fileLabels.map((label) => (
                                                        <option key={label} value={label}>{label}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="file"
                                                    onChange={(e) => updateAdditional(i, 'file', e.target.files[0])}
                                                    className="text-sm text-fg-secondary file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-700"
                                                />
                                                <button type="button" onClick={() => removeAdditional(i)} className="rounded-lg border border-border px-3 text-xs font-bold text-red-600 hover:bg-red-50">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Certification & Signature */}
                        <section className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
                            <div className="border-b border-border bg-surface-tertiary px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Certification &amp; Signature
                                </h2>
                                <p className="mt-1.5 text-xs leading-relaxed text-fg-tertiary">
                                    I certify that the information provided is accurate and complete. Sign below to
                                    submit. Your adviser signs the printed Form 1 separately.
                                </p>
                            </div>
                            <div className="p-6">
                                <SignaturePad onChange={(image) => setData('researcher_signature', image)} />
                                <InputError message={errors.researcher_signature} className="mt-2" />
                            </div>
                        </section>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-4">
                            <Link
                                href={route('dpreq.index')}
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface-secondary px-5 text-sm font-bold text-fg-secondary shadow-sm hover:bg-surface-tertiary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-800 px-5 text-sm font-bold text-white shadow-lg shadow-primary-900/15 hover:bg-primary-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <IconSend size={18} />
                                {processing ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

