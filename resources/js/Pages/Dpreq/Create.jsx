import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconSend, IconShieldLock } from '@tabler/icons-react';
import { Link } from '@inertiajs/react';

// docs/1.1-dpreq-application-form.md — Form 1, the single intake shared by the DPO and Ethics
// tracks (docs/0.4-dpo-ethics-integration.md).
export default function Create() {
    const { data, setData, post, transform, processing, errors } = useForm({
        research_title: '',
        researcher_count: 1,
        adviser_name: '',
        department: '',
        level: '',
        course: '',
        section: '',
        respondents: '',
        target_respondent_count: '',
        data_collection_method: 'survey_form',
        data_capturing_tool: 'electronic_form',
        target_start_date: '',
        target_end_date: '',
        minors_involved: false,
        respondent_head_letter_approved: false,
        applicant_type: 'internal_researcher',
        purpose: '',
        data_types: '',
        data_subjects: '',
        retention_plan: '',
        third_party_sharing: false,
        third_party_detail: '',

        // docs/3.1 Sections C/D (Ethics track — docs/0.4)
        study_type: 'thesis_dissertation',
        study_design: 'quantitative',
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
    });

    const submit = (e) => {
        e.preventDefault();
        transform((formData) => ({
            ...formData,
            data_types: formData.data_types
                ? formData.data_types.split(',').map((s) => s.trim()).filter(Boolean)
                : [],
            data_subjects: formData.data_subjects
                ? formData.data_subjects.split(',').map((s) => s.trim()).filter(Boolean)
                : [],
        }));
        post(route('dpreq.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="New DPREQ Application" />

            <div className="px-5 py-8 font-grotesk text-paper-900 sm:px-8 lg:px-12 lg:py-10">
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

                                <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-paper-600">
                                    Form 1 — Shared intake for the DPO and Ethics review tracks.
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('dpreq.index')}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-paper-200 bg-white px-4 text-sm font-bold text-paper-700 shadow-sm hover:bg-paper-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20"
                        >
                            <IconArrowLeft size={18} />
                            Back to list
                        </Link>
                    </section>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-8">

                        {/* Section A - Applicant Information */}
                        <section className="overflow-hidden rounded-xl border border-paper-200 bg-white">
                            <div className="border-b border-paper-200 bg-paper-50 px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Section A — Applicant Information
                                </h2>
                            </div>

                            <div className="space-y-5 p-6">
                                <div>
                                    <label htmlFor="research_title" className="block text-xs font-bold text-paper-700">
                                        Research Title <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        id="research_title"
                                        type="text"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.research_title}
                                        onChange={(e) => setData('research_title', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.research_title} className="mt-1.5" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="researcher_count" className="block text-xs font-bold text-paper-700">
                                            How many are doing the research? <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="researcher_count"
                                            type="number"
                                            min="1"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.researcher_count}
                                            onChange={(e) => setData('researcher_count', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.researcher_count} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="adviser_name" className="block text-xs font-bold text-paper-700">
                                            Adviser's Name <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="adviser_name"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.adviser_name}
                                            onChange={(e) => setData('adviser_name', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.adviser_name} className="mt-1.5" />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {['department', 'level', 'course', 'section'].map((field) => (
                                        <div key={field}>
                                            <label htmlFor={field} className="block text-xs font-bold text-paper-700">
                                                {field[0].toUpperCase() + field.slice(1)}
                                            </label>
                                            <input
                                                id={field}
                                                type="text"
                                                className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                                value={data[field]}
                                                onChange={(e) => setData(field, e.target.value)}
                                            />
                                            <InputError message={errors[field]} className="mt-1.5" />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label htmlFor="applicant_type" className="block text-xs font-bold text-paper-700">
                                        Applicant Type
                                    </label>
                                    <select
                                        id="applicant_type"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.applicant_type}
                                        onChange={(e) => setData('applicant_type', e.target.value)}
                                    >
                                        <option value="internal_researcher">Internal Researcher</option>
                                        <option value="external_researcher">External Researcher</option>
                                        <option value="student">Student</option>
                                    </select>
                                    <InputError message={errors.applicant_type} className="mt-1.5" />
                                </div>
                            </div>
                        </section>

                        {/* Section B - Study Information */}
                        <section className="overflow-hidden rounded-xl border border-paper-200 bg-white">
                            <div className="border-b border-paper-200 bg-paper-50 px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Section B — Study Information
                                </h2>
                            </div>

                            <div className="space-y-5 p-6">

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="respondents" className="block text-xs font-bold text-paper-700">
                                            Respondents <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="respondents"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.respondents}
                                            onChange={(e) => setData('respondents', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.respondents} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="target_respondent_count" className="block text-xs font-bold text-paper-700">
                                            Target Number of Respondents <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="target_respondent_count"
                                            type="number"
                                            min="1"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.target_respondent_count}
                                            onChange={(e) => setData('target_respondent_count', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.target_respondent_count} className="mt-1.5" />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="data_collection_method" className="block text-xs font-bold text-paper-700">
                                            Data Collection Method
                                        </label>
                                        <select
                                            id="data_collection_method"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.data_collection_method}
                                            onChange={(e) => setData('data_collection_method', e.target.value)}
                                        >
                                            <option value="survey_form">Survey form</option>
                                            <option value="interview">Interview</option>
                                            <option value="mixed">Mixed</option>
                                            <option value="observation">Observation</option>
                                        </select>
                                        <InputError message={errors.data_collection_method} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="data_capturing_tool" className="block text-xs font-bold text-paper-700">
                                            Data Capturing Tool
                                        </label>
                                        <select
                                            id="data_capturing_tool"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.data_capturing_tool}
                                            onChange={(e) => setData('data_capturing_tool', e.target.value)}
                                        >
                                            <option value="electronic_form">Electronic form</option>
                                            <option value="paper_based">Paper-based</option>
                                            <option value="voice_recording">Voice recording</option>
                                            <option value="video_recording">Video recording</option>
                                        </select>
                                        <InputError message={errors.data_capturing_tool} className="mt-1.5" />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="target_start_date" className="block text-xs font-bold text-paper-700">
                                            Duration — Start <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="target_start_date"
                                            type="date"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.target_start_date}
                                            onChange={(e) => setData('target_start_date', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.target_start_date} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="target_end_date" className="block text-xs font-bold text-paper-700">
                                            Duration — End <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="target_end_date"
                                            type="date"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
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
                                            className="mt-0.5 h-4 w-4 rounded border-paper-300 text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                        />
                                        <span className="text-sm font-semibold text-paper-700">
                                            Will you have minors as participants?
                                        </span>
                                    </label>

                                    <label className="flex items-start gap-3">
                                        <input
                                            id="respondent_head_letter_approved"
                                            type="checkbox"
                                            checked={data.respondent_head_letter_approved}
                                            onChange={(e) => setData('respondent_head_letter_approved', e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-paper-300 text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                        />
                                        <span className="text-sm font-semibold text-paper-700">
                                            Approved letter from head of target respondents on file?
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* DPO Review Information */}
                        <section className="overflow-hidden rounded-xl border border-paper-200 bg-white">
                            <div className="border-b border-paper-200 bg-paper-50 px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    DPO Review Information
                                </h2>
                            </div>

                            <div className="space-y-5 p-6">
                                <div>
                                    <label htmlFor="purpose" className="block text-xs font-bold text-paper-700">
                                        Purpose of Data Collection <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="purpose"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.purpose}
                                        onChange={(e) => setData('purpose', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.purpose} className="mt-1.5" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="data_types" className="block text-xs font-bold text-paper-700">
                                            Type of Personal Data Involved <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="data_types"
                                            type="text"
                                            placeholder="Name, Contact Info, Academic Records"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.data_types}
                                            onChange={(e) => setData('data_types', e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-xs text-paper-500">Comma-separated</p>
                                        <InputError message={errors.data_types} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="data_subjects" className="block text-xs font-bold text-paper-700">
                                            Data Subjects <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="data_subjects"
                                            type="text"
                                            placeholder="Students, Employees"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.data_subjects}
                                            onChange={(e) => setData('data_subjects', e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-xs text-paper-500">Comma-separated</p>
                                        <InputError message={errors.data_subjects} className="mt-1.5" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="retention_plan" className="block text-xs font-bold text-paper-700">
                                        Data Storage/Retention Plan <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="retention_plan"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
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
                                            className="mt-0.5 h-4 w-4 rounded border-paper-300 text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                        />
                                        <span className="text-sm font-semibold text-paper-700">
                                            Will data be shared with 3rd parties?
                                        </span>
                                    </label>
                                </div>

                                {data.third_party_sharing && (
                                    <div>
                                        <label htmlFor="third_party_detail" className="block text-xs font-bold text-paper-700">
                                            Third-Party Sharing Detail
                                        </label>
                                        <textarea
                                            id="third_party_detail"
                                            rows="3"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.third_party_detail}
                                            onChange={(e) => setData('third_party_detail', e.target.value)}
                                        />
                                        <InputError message={errors.third_party_detail} className="mt-1.5" />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Ethics Review Information */}
                        <section className="overflow-hidden rounded-xl border border-paper-200 bg-white">
                            <div className="border-b border-paper-200 bg-paper-50 px-6 py-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary-700">
                                    Ethics Review Information
                                </h2>
                                <p className="mt-1.5 text-xs leading-relaxed text-paper-500">
                                    Required for the Ethics/REMIS track — not shown on Form 1 itself, but collected here since one submission starts both tracks.
                                </p>
                            </div>

                            <div className="space-y-5 p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="study_type" className="block text-xs font-bold text-paper-700">
                                            Study Type
                                        </label>
                                        <select
                                            id="study_type"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.study_type}
                                            onChange={(e) => setData('study_type', e.target.value)}
                                        >
                                            <option value="thesis_dissertation">Thesis/Dissertation</option>
                                            <option value="faculty_research">Faculty Research</option>
                                            <option value="institutional">Institutional</option>
                                            <option value="sponsored">Sponsored</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="study_design" className="block text-xs font-bold text-paper-700">
                                            Study Design
                                        </label>
                                        <select
                                            id="study_design"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.study_design}
                                            onChange={(e) => setData('study_design', e.target.value)}
                                        >
                                            <option value="quantitative">Quantitative</option>
                                            <option value="qualitative">Qualitative</option>
                                            <option value="mixed_methods">Mixed Methods</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="study_sites" className="block text-xs font-bold text-paper-700">
                                            Study Site(s) <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="study_sites"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.study_sites}
                                            onChange={(e) => setData('study_sites', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.study_sites} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="funding_source" className="block text-xs font-bold text-paper-700">
                                            Funding Source
                                        </label>
                                        <input
                                            id="funding_source"
                                            type="text"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.funding_source}
                                            onChange={(e) => setData('funding_source', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="target_population" className="block text-xs font-bold text-paper-700">
                                        Target Population <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="target_population"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.target_population}
                                        onChange={(e) => setData('target_population', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.target_population} className="mt-1.5" />
                                </div>

                                <div>
                                    <label htmlFor="participant_count" className="block text-xs font-bold text-paper-700">
                                        Number of Participants <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        id="participant_count"
                                        type="number"
                                        min="1"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.participant_count}
                                        onChange={(e) => setData('participant_count', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.participant_count} className="mt-1.5" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="inclusion_criteria" className="block text-xs font-bold text-paper-700">
                                            Inclusion Criteria <span className="text-red-600">*</span>
                                        </label>
                                        <textarea
                                            id="inclusion_criteria"
                                            rows="3"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                            value={data.inclusion_criteria}
                                            onChange={(e) => setData('inclusion_criteria', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.inclusion_criteria} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="exclusion_criteria" className="block text-xs font-bold text-paper-700">
                                            Exclusion Criteria <span className="text-red-600">*</span>
                                        </label>
                                        <textarea
                                            id="exclusion_criteria"
                                            rows="3"
                                            className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
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
                                            className="mt-0.5 h-4 w-4 rounded border-paper-300 text-primary-700 focus:ring-4 focus:ring-primary-700/20"
                                        />
                                        <span className="text-sm font-semibold text-paper-700">
                                            Does the study involve a vulnerable population?
                                        </span>
                                    </label>
                                </div>

                                <div>
                                    <label htmlFor="risks_to_participants" className="block text-xs font-bold text-paper-700">
                                        Risks to Participants <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="risks_to_participants"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.risks_to_participants}
                                        onChange={(e) => setData('risks_to_participants', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.risks_to_participants} className="mt-1.5" />
                                </div>

                                <div>
                                    <label htmlFor="benefits" className="block text-xs font-bold text-paper-700">
                                        Benefits <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="benefits"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.benefits}
                                        onChange={(e) => setData('benefits', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.benefits} className="mt-1.5" />
                                </div>

                                <div>
                                    <label htmlFor="confidentiality_measures" className="block text-xs font-bold text-paper-700">
                                        Confidentiality Measures <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="confidentiality_measures"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.confidentiality_measures}
                                        onChange={(e) => setData('confidentiality_measures', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.confidentiality_measures} className="mt-1.5" />
                                </div>

                                <div>
                                    <label htmlFor="consent_process" className="block text-xs font-bold text-paper-700">
                                        Consent Process <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="consent_process"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.consent_process}
                                        onChange={(e) => setData('consent_process', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.consent_process} className="mt-1.5" />
                                </div>

                                <div>
                                    <label htmlFor="data_storage_plan" className="block text-xs font-bold text-paper-700">
                                        Data Storage Plan (Ethics) <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        id="data_storage_plan"
                                        rows="3"
                                        className="mt-1.5 block w-full rounded-lg border border-paper-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-paper-400 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                                        value={data.data_storage_plan}
                                        onChange={(e) => setData('data_storage_plan', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.data_storage_plan} className="mt-1.5" />
                                </div>
                            </div>
                        </section>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-4">
                            <Link
                                href={route('dpreq.index')}
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-paper-200 bg-white px-5 text-sm font-bold text-paper-700 shadow-sm hover:bg-paper-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20"
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
