@php
/**
 * Form 3 — Data Privacy and Research Ethics Clearance (joint, dual-signed), docs/0.4
 *
 * @var \App\Shared\ResearchApplications\Models\ResearchApplication $researchApplication
 * @var \App\Shared\Clearance\Models\ClearanceCertificate $certificate
 */
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $certificate->dpreq_certificate_number }}</title>
    @include('pdf.partials._styles')
</head>
<body>
<div class="content-wrapper">

@include('pdf.partials._header', ['formNumber' => 3, 'formTitle' => 'Data Privacy and Research Ethics Clearance'])

<div class="section-heading">I. Purpose</div>
<p class="narrative">
    This form, entitled Data Privacy and Research Ethics Clearance Form 3, is the joint approval
    form for both the Data Privacy Office and the Research Ethics Committee. It is accomplished
    by the DPO Officer and the Research Ethics Head. The clearance can be downloaded and printed
    by the researcher only once both offices have signed.
</p>

<div class="section-heading">II. Scope</div>
<p class="narrative">
    This data privacy and research ethics clearance form is released to the researcher upon
    completion of both the DPO track and the Ethics/REMIS track review procedures.
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
    <tr>
        <td class="label">RESEARCH DURATION:</td>
        <td class="answer">
            <strong>Start:</strong> {{ $researchApplication->target_start_date->format('n/j/y') }} |
            <strong>End:</strong> {{ $researchApplication->target_end_date->format('n/j/y') }}
        </td>
    </tr>
    <tr><td class="label">DPREQ TRACKING NUMBER:</td><td class="answer">{{ $certificate->dpreq_certificate_number }}</td></tr>
    <tr><td class="label">REC TRACKING NUMBER:</td><td class="answer">{{ $certificate->remis_certificate_number }}</td></tr>
    <tr><td class="label">VALID UNTIL:</td><td class="answer">{{ optional($certificate->valid_until)->format('n/j/y') }}</td></tr>
</table>

<div class="spacer-sm"></div>

<table class="bordered" style="font-size: 8pt;">
    <tr>
        <td style="padding: 8px; border: 1px solid #000;">
            <div style="font-weight: bold; margin-bottom: 6px;">Remarks:</div>
            <p style="margin-bottom: 6px; line-height: 1.4;">
                1. Having completed all the procedures and submitted all the required documents
                for both data privacy and research ethics review, the undersigned issue this
                joint clearance, effective only for the period specified in the research
                duration above.
            </p>
            <p style="margin-bottom: 8px; line-height: 1.4;">
                2. Please remember that failing to adhere to your obligations regarding data
                privacy and ethical research procedures breaches your signed non-disclosure
                agreement. The school reserves the right to revoke this clearance at any time if
                the agreement is violated.
            </p>
            <div style="margin-bottom: 8px;">Respectfully yours,</div>

            <table style="width: 100%; border: none; margin-top: 10px;">
                <tr>
                    <td style="width: 50%; border: none; padding: 0; vertical-align: top;">
                        <div style="border-top: 1.5px solid #000; width: 200px; margin-top: 30px; margin-bottom: 4px;"></div>
                        <div style="font-weight: bold; font-size: 8pt;">{{ $certificate->dpoSignedBy?->name }}</div>
                        <div style="font-size: 8pt;">DPO Officer</div>
                    </td>
                    <td style="width: 50%; border: none; padding: 0; vertical-align: top;">
                        <div style="border-top: 1.5px solid #000; width: 200px; margin-top: 30px; margin-bottom: 4px;"></div>
                        <div style="font-weight: bold; font-size: 8pt;">{{ $certificate->ethicsSignedBy?->name }}</div>
                        <div style="font-size: 8pt;">Research Ethics Head</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

<p class="text-small">
    Verify this clearance at the public verification portal using QR token:
    <strong>{{ $certificate->qr_token }}</strong>
</p>

<div class="spacer-md"></div>

@include('pdf.partials._approval')

</div>
@include('pdf.partials._footer', ['documentId' => 'DPO-EFORM-3'])
</body>
</html>
