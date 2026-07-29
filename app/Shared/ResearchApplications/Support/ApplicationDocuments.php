<?php

namespace App\Shared\ResearchApplications\Support;

use App\Shared\Documents\Support\UploadRules;

// FRS §III.E document set for the research application intake (Form 1). One definition drives the
// request validation, the frontend upload section, and the storage loop — so the three can't drift.
//
// `requirement`:
//   mandatory  — the application "cannot proceed" without it (FRS §III.E System Validation)
//   minors     — required only when minors are involved (conditional)
//   optional   — "as applicable"
//
// `label` is the FileLabel token baked into the stored filename (DocumentService naming).
// These are all ethics-review documents, so they attach to the RemisApplication.
class ApplicationDocuments
{
    public const SLOTS = [
        'research_proposal' => ['title' => 'Research Proposal (may extend from Chapters 1–3)', 'label' => 'RESEARCHPROPOSAL', 'requirement' => 'mandatory'],
        'research_instrument' => ['title' => 'Research Instrument(s)', 'label' => 'QUESTIONNAIRE', 'requirement' => 'mandatory'],
        'approved_request_letter' => ['title' => 'Approved Formal Request Letter (from head of target respondents)', 'label' => 'APPROVALLETTER', 'requirement' => 'mandatory'],
        'adviser_endorsement_letter' => ['title' => "Adviser's Endorsement Letter", 'label' => 'ENDORSEMENTLETTER', 'requirement' => 'mandatory'],
        'consent_form' => ['title' => 'Consent Form', 'label' => 'INFORMEDCONSENT', 'requirement' => 'mandatory'],
        'parent_consent' => ['title' => 'Parent Consent', 'label' => 'CONSENTLETTER', 'requirement' => 'minors'],
        'assent_form' => ['title' => 'Assent Form', 'label' => 'ASSENTFORM', 'requirement' => 'minors'],
        'permission_letters' => ['title' => 'Permission Letters', 'label' => 'PERMISSIONLETTER', 'requirement' => 'optional'],
        'ethics_training_certificate' => ['title' => 'Ethics Training Certificate', 'label' => 'ETHICSFORM', 'requirement' => 'optional'],
    ];

    /**
     * Validation rules for the fixed document slots. When minors are involved the two conditional
     * slots become required; the mandatory set is always required.
     *
     * Each slot accepts one OR MORE files (stakeholder 2026-07-28 — e.g. two or three research
     * instruments), so the slot value is an array and each element is validated as a file.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(bool $minorsInvolved): array
    {
        $rules = [];

        foreach (self::SLOTS as $key => $slot) {
            $required = $slot['requirement'] === 'mandatory'
                || ($slot['requirement'] === 'minors' && $minorsInvolved);

            $rules["documents.{$key}"] = $required ? ['required', 'array', 'min:1'] : ['nullable', 'array'];
            $rules["documents.{$key}.*"] = UploadRules::rules(required: false);
        }

        return $rules;
    }

    /**
     * Slot metadata for the frontend, each flagged with whether it is required given the current
     * minors answer (so the UI can mark and gate them without duplicating the requirement logic).
     *
     * @return array<int, array{key: string, title: string, requirement: string}>
     */
    public static function forDisplay(): array
    {
        return array_map(
            fn (string $key) => ['key' => $key, ...self::SLOTS[$key]],
            array_keys(self::SLOTS),
        );
    }
}
