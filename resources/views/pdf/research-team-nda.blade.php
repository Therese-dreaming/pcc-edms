@php
/**
 * Form 2 — Non-Disclosure Agreement (Research Team NDA), docs/2.1-dpnda-nda-template.md §2.1.a
 *
 * @var \App\Shared\ResearchApplications\Models\ResearchApplication $researchApplication
 * @var \App\Modules\Dpreq\Models\ResearchTeamNda $nda
 */
$signatories = $nda->signatories;
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $nda->tracking_number }}</title>
    @include('pdf.partials._styles')
</head>
<body>
<div class="content-wrapper">

@include('pdf.partials._header', ['formNumber' => 2, 'formTitle' => 'Non-Disclosure Agreement'])

<div class="section-heading">I. Purpose</div>
<p class="narrative">
    This form, entitled Non-Disclosure Agreement Form 2, will be the accompanying application
    form for policy DPO-POL-005. All team members must sign the form if a group conducts the
    research. After gaining access to the Electronic Document Management System (EDMS), the
    research group leader must facilitate the signing process. Please note that clearance will
    only be released if the non-disclosure agreement is completed.
</p>

<div class="section-heading">II. Scope</div>
<p class="narrative">
    This non-disclosure agreement is applicable to individuals conducting research with human
    subjects, collecting data from school resources or students, and using school property or
    equipment for data collection. This form is not a stand-alone document but part of the
    procedure of DPO-POL-005. It must be accomplished electronically by the researcher.
</p>

<table class="question-table">
    <tr><td class="label">RESEARCH TITLE:</td><td class="answer">{{ $researchApplication->research_title }}</td></tr>
    <tr><td class="label">RESEARCHER OR TEAM LEAD:</td><td class="answer">{{ $researchApplication->applicant->name }}</td></tr>
    <tr><td class="label">TOTAL NUMBER PER GROUP:</td><td class="answer">{{ $researchApplication->researcher_count }}</td></tr>
    <tr><td class="label">ADVISER'S NAME:</td><td class="answer">{{ $researchApplication->adviser_name }}</td></tr>
    <tr>
        <td class="label">DEPT./LEVEL/COURSE/SECTION:</td>
        <td class="answer">
            <strong>Dept:</strong> {{ $researchApplication->department }} |
            <strong>Level:</strong> {{ $researchApplication->level }} |
            <strong>Course:</strong> {{ $researchApplication->course }} |
            <strong>Section:</strong> {{ $researchApplication->section }}
        </td>
    </tr>
    <tr><td class="label">RESPONDENTS:</td><td class="answer">{{ $researchApplication->respondents }}</td></tr>
    <tr><td class="label">TOTAL RESPONDENTS:</td><td class="answer">{{ $researchApplication->target_respondent_count }}</td></tr>
    <tr><td class="label">DATA COLLECTION METHOD:</td><td class="answer">{{ str($researchApplication->data_collection_method)->replace('_', ' ')->title() }}</td></tr>
    <tr><td class="label">DATA CAPTURING TOOL:</td><td class="answer">{{ str($researchApplication->data_capturing_tool)->replace('_', ' ')->title() }}</td></tr>
    <tr>
        <td class="label">RESEARCH DURATION:</td>
        <td class="answer">
            <strong>Start:</strong> {{ $researchApplication->target_start_date->format('n/j/y') }} |
            <strong>End:</strong> {{ $researchApplication->target_end_date->format('n/j/y') }}
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

<div class="text-bold" style="margin-bottom: 4px;">OBLIGATIONS OF THE RESEARCHER/S</div>
<table class="bordered checklist">
    <thead>
        <tr><th class="num">#</th><th>Obligation</th><th class="response">Yes</th><th class="response">No</th><th class="response">N/A</th></tr>
    </thead>
    <tbody>
        @foreach([
            'I will use the data gathered solely for the purpose of conducting the study.',
            'I will not disclose, publish, or otherwise disseminate confidential information to any third party without the prior written consent of the school.',
            'I shall not use the information for any commercial, personal, or other unauthorized purpose.',
            "I will anonymize participants' identities and responses and will keep it confidential.",
            'I will maintain reasonable security measures in the storage such as password protected files or other appropriate measures.',
            'I will avoid exposing participants to harm or risk.',
            "Upon completion of the study, I will return or destroy all confidential information and all copies at the school's request.",
            'I will promptly share a copy of the study in PDF form by uploading it in the EDMS, if the school requests it.',
        ] as $i => $text)
            <tr>
                <td class="num">{{ $i + 1 }}</td>
                <td>{{ $text }}</td>
                <td class="response"><span class="response-circle filled"></span></td>
                <td class="response"><span class="response-circle"></span></td>
                <td class="response"><span class="response-circle"></span></td>
            </tr>
        @endforeach
    </tbody>
</table>

<div class="spacer-sm"></div>

@include('pdf.partials._certification', ['certified' => true])

<div class="spacer-sm"></div>

<div class="text-bold" style="margin-bottom: 4px;">Researchers</div>
<table class="bordered">
    <thead><tr><th style="width: 40%;">Name</th><th style="width: 20%;">Role</th><th style="width: 40%;">Signature</th></tr></thead>
    <tbody>
        @foreach($signatories as $i => $s)
            <tr>
                <td>{{ $i + 1 }}. {{ $s->full_name }}</td>
                <td>{{ ucfirst($s->role) }}</td>
                <td>
                    @if ($s->signature_image)
                        <img src="{{ $s->signature_image }}" style="height: 32px;" alt="signature">
                    @endif
                    {{ $s->signature_id ?? '' }}
                </td>
            </tr>
        @endforeach
    </tbody>
</table>

<div class="spacer-md"></div>

@include('pdf.partials._version_control', ['initialVersionDate' => 'April 15, 2026'])

<div class="spacer-md"></div>

@include('pdf.partials._approval')

</div>
@include('pdf.partials._footer', ['documentId' => 'DPO-EFORM-2'])
</body>
</html>
