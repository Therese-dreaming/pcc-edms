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
            'applicant_category' => ['required', 'in:student,employee'],
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
