<?php

namespace App\Modules\Dpreq\Http\Requests;

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

    public function rules(): array
    {
        return [
            // Form 1, Section A/B (🟢)
            'research_title' => ['required', 'string', 'max:255'],
            'researcher_count' => ['required', 'integer', 'min:1', 'max:20'],
            'adviser_name' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:255'],
            'course' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'respondents' => ['required', 'string', 'max:255'],
            'target_respondent_count' => ['required', 'integer', 'min:1'],
            'data_collection_method' => ['required', 'in:survey_form,interview,mixed,observation'],
            'data_capturing_tool' => ['required', 'in:electronic_form,paper_based,voice_recording,video_recording'],
            'target_start_date' => ['required', 'date'],
            'target_end_date' => ['required', 'date', 'after_or_equal:target_start_date'],
            'minors_involved' => ['boolean'],
            'respondent_head_letter_approved' => ['boolean'],

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
            'study_type' => ['required', 'in:thesis_dissertation,faculty_research,institutional,sponsored'],
            'study_design' => ['required', 'in:quantitative,qualitative,mixed_methods'],
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
        ];
    }
}
