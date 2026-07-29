<?php

namespace App\Shared\Documents\Support;

// stakeholder-additional-features.md, "Automatic File Naming Convention" (2026-07-25) — the
// FILELABEL segment of REC-{MODULE}-{DEPT}-{CTRL}_{YYYYMMDD}_{FILELABEL}. These are the
// standard, human-meaningful labels a document can carry. Applicant-facing upload UIs should let
// the user pick one of ALL; system-generated documents pass their own internal type, which
// normalize() cleans into a filename-safe token.
class FileLabel
{
    /**
     * The standard document labels from the stakeholder spec. Exposed so upload forms can offer
     * them as a dropdown (kept here so the list can't drift out of sync with the validator).
     *
     * @var list<string>
     */
    public const ALL = [
        'APPROVALLETTER',
        'CONSENTLETTER',
        'INFORMEDCONSENT',
        'ENDORSEMENTLETTER',
        'RESEARCHPROPOSAL',
        'QUESTIONNAIRE',
        'SURVEYFORM',
        'DATASET',
        'DATAPRIVACYFORM',
        'ETHICSFORM',
        'PERMISSIONLETTER',
        'ASSENTFORM',
        'OTHERDOCUMENT',
    ];

    /**
     * Normalize any raw document-type string into a filename-safe FILELABEL token: uppercase,
     * alphanumerics only. A value already in ALL is returned unchanged; anything else is cleaned
     * (e.g. "Signed Research Team NDA" -> "SIGNEDRESEARCHTEAMNDA"). Empty input -> OTHERDOCUMENT.
     */
    public static function normalize(string $raw): string
    {
        $token = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $raw) ?? '');

        return $token !== '' ? $token : 'OTHERDOCUMENT';
    }
}
