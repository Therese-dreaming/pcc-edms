<?php

namespace App\Modules\Dpreq\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Stakeholder 2026-07-28 — editing the Form-1 fields of a submitted application. Only the fields that
// appear on the generated Form 1 are editable here (ethics-only fields are amended on the REMIS
// side). Documents and the researcher signature are optional on edit — the originals stand unless
// re-supplied. When any of these changes, the controller regenerates the Form 1 PDF.
class UpdateDpreqApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('dpreqApplication'));
    }

    public function rules(): array
    {
        return [
            // Section A/B (shared research_application)
            'research_title' => ['required', 'string', 'max:255'],
            'adviser_name' => ['required', 'string', 'max:255'],
            // Category is fixed at account creation, not editable on the form (2026-09-05) — preserved
            // by ResearchApplicationService::updateForm1.
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

            // Review checklist (Form 1 items 3–7)
            'review_checklist' => ['required', 'array'],
            'review_checklist.voluntary_participation' => ['required', 'in:yes,no,not_applicable'],
            'review_checklist.confidentiality' => ['required', 'in:yes,no,not_applicable'],
            'review_checklist.free_withdrawal' => ['required', 'in:yes,no,not_applicable'],
            'review_checklist.avoid_harm' => ['required', 'in:yes,no,not_applicable'],
            'review_checklist.academic_use_only' => ['required', 'in:yes,no,not_applicable'],

            // Unified Form 1, Parts II–V (resolution B1) — optional on edit; current values stand
            // unless re-supplied.
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

            // Section III — DPO / data-privacy info (dpreq_application)
            'purpose' => ['required', 'string'],
            'data_types' => ['required', 'array', 'min:1'],
            'data_types.*' => ['string'],
            'data_subjects' => ['required', 'array', 'min:1'],
            'data_subjects.*' => ['string'],
            'retention_plan' => ['required', 'string'],
            'third_party_sharing' => ['boolean'],
            'third_party_detail' => ['required_if:third_party_sharing,true', 'nullable', 'string'],

            // Re-signing is optional; the original signature stands if omitted.
            'researcher_signature' => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:400000'],
        ];
    }
}
