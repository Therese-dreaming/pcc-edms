import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Checkbox from '@/Components/Checkbox';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, useForm } from '@inertiajs/react';

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
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Form 1 — Application for Data Privacy and Ethics Review
                </h2>
            }
        >
            <Head title="New DPREQ Application" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="space-y-6">
                            <h3 className="text-lg font-semibold">Section A — Applicant Information</h3>

                            <div>
                                <InputLabel htmlFor="research_title" value="Research Title" />
                                <TextInput
                                    id="research_title"
                                    className="mt-1 block w-full"
                                    value={data.research_title}
                                    onChange={(e) => setData('research_title', e.target.value)}
                                    required
                                />
                                <InputError message={errors.research_title} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="researcher_count" value="How many are doing the research?" />
                                    <TextInput
                                        id="researcher_count"
                                        type="number"
                                        min="1"
                                        className="mt-1 block w-full"
                                        value={data.researcher_count}
                                        onChange={(e) => setData('researcher_count', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.researcher_count} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="adviser_name" value="Adviser's Name" />
                                    <TextInput
                                        id="adviser_name"
                                        className="mt-1 block w-full"
                                        value={data.adviser_name}
                                        onChange={(e) => setData('adviser_name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.adviser_name} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                {['department', 'level', 'course', 'section'].map((field) => (
                                    <div key={field}>
                                        <InputLabel htmlFor={field} value={field[0].toUpperCase() + field.slice(1)} />
                                        <TextInput
                                            id={field}
                                            className="mt-1 block w-full"
                                            value={data[field]}
                                            onChange={(e) => setData(field, e.target.value)}
                                        />
                                        <InputError message={errors[field]} className="mt-2" />
                                    </div>
                                ))}
                            </div>

                            <div>
                                <InputLabel htmlFor="applicant_type" value="Applicant Type" />
                                <select
                                    id="applicant_type"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.applicant_type}
                                    onChange={(e) => setData('applicant_type', e.target.value)}
                                >
                                    <option value="internal_researcher">Internal Researcher</option>
                                    <option value="external_researcher">External Researcher</option>
                                    <option value="student">Student</option>
                                </select>
                                <InputError message={errors.applicant_type} className="mt-2" />
                            </div>

                            <h3 className="pt-4 text-lg font-semibold">Section B — Study Information</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="respondents" value="Respondents" />
                                    <TextInput
                                        id="respondents"
                                        className="mt-1 block w-full"
                                        value={data.respondents}
                                        onChange={(e) => setData('respondents', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.respondents} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="target_respondent_count" value="Target Number of Respondents" />
                                    <TextInput
                                        id="target_respondent_count"
                                        type="number"
                                        min="1"
                                        className="mt-1 block w-full"
                                        value={data.target_respondent_count}
                                        onChange={(e) => setData('target_respondent_count', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.target_respondent_count} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="data_collection_method" value="Data Collection Method" />
                                    <select
                                        id="data_collection_method"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        value={data.data_collection_method}
                                        onChange={(e) => setData('data_collection_method', e.target.value)}
                                    >
                                        <option value="survey_form">Survey form</option>
                                        <option value="interview">Interview</option>
                                        <option value="mixed">Mixed</option>
                                        <option value="observation">Observation</option>
                                    </select>
                                    <InputError message={errors.data_collection_method} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="data_capturing_tool" value="Data Capturing Tool" />
                                    <select
                                        id="data_capturing_tool"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        value={data.data_capturing_tool}
                                        onChange={(e) => setData('data_capturing_tool', e.target.value)}
                                    >
                                        <option value="electronic_form">Electronic form</option>
                                        <option value="paper_based">Paper-based</option>
                                        <option value="voice_recording">Voice recording</option>
                                        <option value="video_recording">Video recording</option>
                                    </select>
                                    <InputError message={errors.data_capturing_tool} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="target_start_date" value="Duration — Start" />
                                    <TextInput
                                        id="target_start_date"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.target_start_date}
                                        onChange={(e) => setData('target_start_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.target_start_date} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="target_end_date" value="Duration — End" />
                                    <TextInput
                                        id="target_end_date"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.target_end_date}
                                        onChange={(e) => setData('target_end_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.target_end_date} className="mt-2" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="minors_involved"
                                    checked={data.minors_involved}
                                    onChange={(e) => setData('minors_involved', e.target.checked)}
                                />
                                <InputLabel htmlFor="minors_involved" value="Will you have minors as participants?" />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="respondent_head_letter_approved"
                                    checked={data.respondent_head_letter_approved}
                                    onChange={(e) => setData('respondent_head_letter_approved', e.target.checked)}
                                />
                                <InputLabel htmlFor="respondent_head_letter_approved" value="Approved letter from head of target respondents on file?" />
                            </div>

                            <h3 className="pt-4 text-lg font-semibold">DPO Review Information</h3>

                            <div>
                                <InputLabel htmlFor="purpose" value="Purpose of Data Collection" />
                                <textarea
                                    id="purpose"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    required
                                />
                                <InputError message={errors.purpose} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="data_types" value="Type of Personal Data Involved (comma-separated)" />
                                    <TextInput
                                        id="data_types"
                                        className="mt-1 block w-full"
                                        placeholder="Name, Contact Info, Academic Records"
                                        value={data.data_types}
                                        onChange={(e) => setData('data_types', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.data_types} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="data_subjects" value="Data Subjects (comma-separated)" />
                                    <TextInput
                                        id="data_subjects"
                                        className="mt-1 block w-full"
                                        placeholder="Students, Employees"
                                        value={data.data_subjects}
                                        onChange={(e) => setData('data_subjects', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.data_subjects} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="retention_plan" value="Data Storage/Retention Plan" />
                                <textarea
                                    id="retention_plan"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.retention_plan}
                                    onChange={(e) => setData('retention_plan', e.target.value)}
                                    required
                                />
                                <InputError message={errors.retention_plan} className="mt-2" />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="third_party_sharing"
                                    checked={data.third_party_sharing}
                                    onChange={(e) => setData('third_party_sharing', e.target.checked)}
                                />
                                <InputLabel htmlFor="third_party_sharing" value="Will data be shared with 3rd parties?" />
                            </div>

                            {data.third_party_sharing && (
                                <div>
                                    <InputLabel htmlFor="third_party_detail" value="Third-Party Sharing Detail" />
                                    <textarea
                                        id="third_party_detail"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        value={data.third_party_detail}
                                        onChange={(e) => setData('third_party_detail', e.target.value)}
                                    />
                                    <InputError message={errors.third_party_detail} className="mt-2" />
                                </div>
                            )}

                            <h3 className="pt-4 text-lg font-semibold">Ethics Review Information</h3>
                            <p className="text-sm text-gray-500">
                                Required for the Ethics/REMIS track (docs/3.1 Sections C/D) — not shown on Form 1 itself, but collected here since one submission starts both tracks (docs/0.4).
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="study_type" value="Study Type" />
                                    <select
                                        id="study_type"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
                                    <InputLabel htmlFor="study_design" value="Study Design" />
                                    <select
                                        id="study_design"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        value={data.study_design}
                                        onChange={(e) => setData('study_design', e.target.value)}
                                    >
                                        <option value="quantitative">Quantitative</option>
                                        <option value="qualitative">Qualitative</option>
                                        <option value="mixed_methods">Mixed Methods</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="study_sites" value="Study Site(s)" />
                                    <TextInput
                                        id="study_sites"
                                        className="mt-1 block w-full"
                                        value={data.study_sites}
                                        onChange={(e) => setData('study_sites', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.study_sites} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="funding_source" value="Funding Source" />
                                    <TextInput
                                        id="funding_source"
                                        className="mt-1 block w-full"
                                        value={data.funding_source}
                                        onChange={(e) => setData('funding_source', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="target_population" value="Target Population" />
                                <textarea
                                    id="target_population"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.target_population}
                                    onChange={(e) => setData('target_population', e.target.value)}
                                    required
                                />
                                <InputError message={errors.target_population} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="participant_count" value="Number of Participants" />
                                <TextInput
                                    id="participant_count"
                                    type="number"
                                    min="1"
                                    className="mt-1 block w-full"
                                    value={data.participant_count}
                                    onChange={(e) => setData('participant_count', e.target.value)}
                                    required
                                />
                                <InputError message={errors.participant_count} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="inclusion_criteria" value="Inclusion Criteria" />
                                    <textarea
                                        id="inclusion_criteria"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        value={data.inclusion_criteria}
                                        onChange={(e) => setData('inclusion_criteria', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.inclusion_criteria} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="exclusion_criteria" value="Exclusion Criteria" />
                                    <textarea
                                        id="exclusion_criteria"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        value={data.exclusion_criteria}
                                        onChange={(e) => setData('exclusion_criteria', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.exclusion_criteria} className="mt-2" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="vulnerable_population"
                                    checked={data.vulnerable_population}
                                    onChange={(e) => setData('vulnerable_population', e.target.checked)}
                                />
                                <InputLabel htmlFor="vulnerable_population" value="Does the study involve a vulnerable population?" />
                            </div>

                            <div>
                                <InputLabel htmlFor="risks_to_participants" value="Risks to Participants" />
                                <textarea
                                    id="risks_to_participants"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.risks_to_participants}
                                    onChange={(e) => setData('risks_to_participants', e.target.value)}
                                    required
                                />
                                <InputError message={errors.risks_to_participants} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="benefits" value="Benefits" />
                                <textarea
                                    id="benefits"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.benefits}
                                    onChange={(e) => setData('benefits', e.target.value)}
                                    required
                                />
                                <InputError message={errors.benefits} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="confidentiality_measures" value="Confidentiality Measures" />
                                <textarea
                                    id="confidentiality_measures"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.confidentiality_measures}
                                    onChange={(e) => setData('confidentiality_measures', e.target.value)}
                                    required
                                />
                                <InputError message={errors.confidentiality_measures} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="consent_process" value="Consent Process" />
                                <textarea
                                    id="consent_process"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.consent_process}
                                    onChange={(e) => setData('consent_process', e.target.value)}
                                    required
                                />
                                <InputError message={errors.consent_process} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="data_storage_plan" value="Data Storage Plan (Ethics)" />
                                <textarea
                                    id="data_storage_plan"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.data_storage_plan}
                                    onChange={(e) => setData('data_storage_plan', e.target.value)}
                                    required
                                />
                                <InputError message={errors.data_storage_plan} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end">
                                <PrimaryButton disabled={processing}>Submit Application</PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
