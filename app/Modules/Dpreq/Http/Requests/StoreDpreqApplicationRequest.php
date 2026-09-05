<?php

namespace App\Modules\Dpreq\Http\Requests;

use App\Shared\Documents\Support\UploadRules;
use App\Shared\ResearchApplications\Support\ApplicationDocuments;
use Illuminate\Foundation\Http\FormRequest;

// docs/1.1-dpreq-application-form.md — Form 1 fields (🟢, confirmed) plus the proposed
// DPO-internal fields (🔴, not on Form 1 but requested by this draft pending DPO confirmation).
// Also validates docs/3.1 Sections C/D (Ethics-required fields) — docs/0.4-dpo-ethics-integration.md
// means this one submission starts both the DPO and Ethics tracks, so it must collect both
// tracks' data even though Form 1 itself (reqs/) doesn't show the Ethics-specific fields.
class StoreDpreqApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Modules\Dpreq\Models\DpreqApplication::class);
    }

    // B4 (concern 4) — Applicant Type is not trusted from the client; it is derived from the
    // authenticated user's role before validation, so the posted value can never override it.
    protected function prepareForValidation(): void
    {
        // Drop co-researcher rows left completely blank (or whitespace only) — an added-then-abandoned
        // row is an accident, not missing data, so it's treated as "none" rather than a hard error.
        // A row with *some* content (e.g. a name but no email) is kept so it still validates.
        $coResearchers = collect($this->input('co_researchers', []))
            ->filter(fn ($member) => is_array($member)
                && (trim((string) ($member['full_name'] ?? '')) !== '' || trim((string) ($member['email'] ?? '')) !== ''))
            ->values()
            ->all();

        $this->merge([
            'applicant_type' => $this->user()->dpreqApplicantType(),
            'co_researchers' => $coResearchers,
            // Keep the total researcher count consistent with the real roster (lead + co-researchers)
            // once the empty rows are removed, so the B2 count check can't fail on a dropped row.
            'researcher_count' => count($coResearchers) + 1,
        ]);
    }

    // B2 (concern 3.1) — the co-researcher roster must be exactly one fewer than the total
    // researcher count (the lead applicant makes up the difference).
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $count = (int) $this->input('researcher_count');
            $co = $this->input('co_researchers', []);
            if (is_array($co) && count($co) !== max(0, $count - 1)) {
                $validator->errors()->add(
                    'co_researchers',
                    'The number of co-researchers must be one fewer than the total number of researchers (you are the remaining one).',
                );
            }
        });
    }

    public function rules(): array
    {
        $minors = $this->boolean('minors_involved');

        return [
            // Form 1, Section A/B (🟢)
            'research_title' => ['required', 'string', 'max:255'],
            'researcher_count' => ['required', 'integer', 'min:1', 'max:20'],
            'adviser_name' => ['required', 'string', 'max:255'],
            // FRS §III.A/B additions (2026-07-25). The closed dropdowns now allow an "other" choice
            // with a companion free-text field (stakeholder 2026-07-28), collapsed to a single stored
            // value by ResearchApplicationService.
            'research_category' => ['required', 'in:academic,institutional,sponsored,student_thesis,faculty,other'],
            'research_category_other' => ['nullable', 'string', 'max:255', 'required_if:research_category,other'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            // The intake serves employees too (stakeholder 2026-07-28): students give
            // level/course/section, employees give a position — both optional. The category itself is
            // no longer asked here (2026-09-05): it is fixed on the account at creation and derived
            // server-side (ResearchApplicationService::submitForm1 → User::applicantCategory()).
            'department' => ['nullable', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:255'],
            'course' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'respondents' => ['required', 'string', 'max:255'],
            'target_respondent_count' => ['required', 'integer', 'min:1'],
            'data_collection_method' => ['required', 'in:survey_form,interview,mixed,observation,other'],
            'data_collection_method_other' => ['nullable', 'string', 'max:255', 'required_if:data_collection_method,other'],
            'data_capturing_tool' => ['required', 'in:electronic_form,paper_based,voice_recording,video_recording,other'],
            'data_capturing_tool_other' => ['nullable', 'string', 'max:255', 'required_if:data_capturing_tool,other'],
            'target_start_date' => ['required', 'date'],
            'target_end_date' => ['required', 'date', 'after_or_equal:target_start_date'],
            'minors_involved' => ['boolean'],
            'respondent_head_letter_approved' => ['boolean'],

            // Researcher's drawn signature on Form 1 (stakeholder 2026-07-28) — a PNG data URI.
            'researcher_signature' => ['required', 'string', 'starts_with:data:image/png;base64,', 'max:400000'],

            // Form 1 review checklist (items 3–7) — answered on the intake, stored as JSON. Each is a
            // yes/no/not-applicable declaration (docs/1.1, dpreq-form1.blade).
            'review_checklist' => ['required', 'array'],
            'review_checklist.voluntary_participation' => ['required', 'in:yes,no,not_applicable'],
            'review_checklist.confidentiality' => ['required', 'in:yes,no,not_applicable'],
            'review_checklist.free_withdrawal' => ['required', 'in:yes,no,not_applicable'],
            'review_checklist.avoid_harm' => ['required', 'in:yes,no,not_applicable'],
            'review_checklist.academic_use_only' => ['required', 'in:yes,no,not_applicable'],

            // Unified Form 1, Parts II–V (reqs/ July-7-2026 PDF, resolution B1 2026-08-31).
            // Nullable while the form rolls out; validated whenever supplied.
            'funding_source_type' => ['nullable', 'in:self_funded,university_funded,externally_funded,other'],
            'funding_source_type_other' => ['nullable', 'string', 'max:255', 'required_if:funding_source_type,other'],
            'recruitment_method' => ['nullable', 'string'],
            'target_participants' => ['nullable', 'array'],
            'target_participants.*' => ['string', 'in:students,employees,faculty,parents,community_members,minors,vulnerable_groups,others'],
            'ethics_checklist' => ['nullable', 'array'],
            'ethics_checklist.*' => ['in:yes,no,not_applicable'],
            'risk_band' => ['nullable', 'in:none,minimal,moderate,high'],
            'risk_band_explanation' => ['nullable', 'string'],
            'data_classification' => ['nullable', 'in:non_personal,personal_information,sensitive_personal_information,privileged_information'],
            'data_storage_method' => ['nullable', 'string', 'max:255'],
            'data_access_persons' => ['nullable', 'string'],
            'data_retention_period' => ['nullable', 'string', 'max:255'],
            'data_disposal_method' => ['nullable', 'string', 'max:255'],

            // Proposed DPO-internal fields (🔴, docs/1.1)
            'applicant_type' => ['required', 'in:internal_researcher,external_researcher,student'],
            'purpose' => ['required', 'string'],
            'data_types' => ['required', 'array', 'min:1'],
            'data_types.*' => ['string'],
            'data_subjects' => ['required', 'array', 'min:1'],
            'data_subjects.*' => ['string'],
            'retention_plan' => ['required', 'string'],
            'third_party_sharing' => ['boolean'],
            'third_party_detail' => ['required_if:third_party_sharing,true', 'nullable', 'string'],

            // docs/3.1 Sections C/D (FRS-sourced, Ethics track)
            'study_type' => ['required', 'in:thesis_dissertation,faculty_research,institutional,sponsored,other'],
            'study_type_other' => ['nullable', 'string', 'max:255', 'required_if:study_type,other'],
            'study_design' => ['required', 'in:quantitative,qualitative,mixed_methods,other'],
            'study_design_other' => ['nullable', 'string', 'max:255', 'required_if:study_design,other'],
            'study_sites' => ['required', 'string', 'max:255'],
            'funding_source' => ['nullable', 'string', 'max:255'],
            'target_population' => ['required', 'string'],
            'participant_count' => ['required', 'integer', 'min:1'],
            'inclusion_criteria' => ['required', 'string'],
            'exclusion_criteria' => ['required', 'string'],
            'vulnerable_population' => ['boolean'],
            'risks_to_participants' => ['required', 'string'],
            'benefits' => ['required', 'string'],
            'confidentiality_measures' => ['required', 'string'],
            'consent_process' => ['required', 'string'],
            'data_storage_plan' => ['required', 'string'],

            // FRS §III.B — co-researcher identities (name + email + optional role). Each becomes a
            // Research Team NDA signatory with an emailed signing link. Optional: a solo researcher
            // has none.
            'co_researchers' => ['nullable', 'array', 'max:19'],
            'co_researchers.*.full_name' => ['required_with:co_researchers', 'string', 'max:255'],
            'co_researchers.*.email' => ['required_with:co_researchers', 'email', 'max:255'],

            // FRS §III.E — mandatory + conditional document uploads (see ApplicationDocuments).
            ...ApplicationDocuments::rules($minors),

            // Item 6 — additional supporting documents, each with a standard label. Attached to the
            // DPO (DPREQ) track so DPO sees them alongside the data-privacy review.
            'additional_documents' => ['nullable', 'array', 'max:20'],
            'additional_documents.*.label' => ['required_with:additional_documents', 'string', 'max:100'],
            'additional_documents.*.file' => UploadRules::rules(required: true),
        ];
    }

    public function messages(): array
    {
        return [
            'documents.research_proposal.required' => 'The Research Proposal is a mandatory document.',
            'documents.consent_form.required' => 'The Consent Form is a mandatory document.',
            'documents.research_instrument.required' => 'The Research Instrument is a mandatory document.',
            'documents.parent_consent.required' => 'Parent Consent is required when minors are involved.',
            'documents.assent_form.required' => 'An Assent Form is required when minors are involved.',
        ];
    }
}
