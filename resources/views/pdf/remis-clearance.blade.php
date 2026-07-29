@php
/**
 * Research Ethics (REC/REMIS) Clearance Certificate — issued independently by the Research Ethics
 * Committee when the ethics decision is "approved"/"approved with conditions". Content follows the
 * official template (reqs/REMIS-certs/REC-Clearance-Certificate.pdf, stakeholder 2026-07-28); the
 * system adds a control number and QR verification. Not connected to the Data Privacy (Form 3)
 * clearance in any way.
 *
 * @var \App\Shared\ResearchApplications\Models\ResearchApplication $researchApplication
 * @var \App\Shared\Clearance\Models\ClearanceCertificate $certificate
 */
    $r = $researchApplication;
    $chair = config('rec.chair');
    $member = config('rec.member');
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $certificate->remis_certificate_number }}</title>
    @include('pdf.partials._styles')
</head>
<body>
<div class="content-wrapper">

@include('pdf.partials._header', ['formNumber' => '3-RE', 'formTitle' => 'Research Ethics Clearance Certificate'])

<p class="narrative">
    This is to certify that the research ethics clearance application submitted by:
</p>

<table class="question-table">
    <tr><td class="label">RESEARCHER(S):</td><td class="answer">{{ $r->applicant->name }}</td></tr>
    <tr><td class="label">STUDENT/EMPLOYEE NUMBER:</td><td class="answer">{{ $r->applicant->student_number ?: '—' }}</td></tr>
    <tr><td class="label">TITLE OF RESEARCH STUDY:</td><td class="answer">{{ $r->research_title }}</td></tr>
    <tr><td class="label">SUPERVISOR/ADVISER:</td><td class="answer">{{ $r->adviser_name }}</td></tr>
</table>

<p class="narrative">
    has been reviewed and approved by the <strong>Pasig Catholic College Research Ethics Committee
    (REC)</strong> in compliance with the PCC Research Ethics Management System Procedures, the CHED
    Memorandum Orders on Research, and the PAASCU accreditation standards.
</p>

<div class="section-heading">Decision of the Committee</div>
<p class="narrative">
    &#9745; <strong>Application Approved</strong> &nbsp;&nbsp; &#9744; Application Deferred
    &nbsp;&nbsp; &#9744; Application Disapproved
</p>

<table class="question-table">
    <tr><td class="label">DATE OF REVIEW:</td><td class="answer">{{ optional($certificate->remis_issued_at)->format('F j, Y') }}</td></tr>
    <tr><td class="label">REC REFERENCE NUMBER:</td><td class="answer">{{ $certificate->remis_certificate_number }}</td></tr>
</table>

<div class="section-heading">Conditions of Approval</div>
<table class="bordered" style="font-size: 8pt;">
    <tr>
        <td style="padding: 8px; border: 1px solid #000;">
            <p class="narrative" style="margin-bottom: 6px;">
                1. The researcher(s) must adhere to the approved protocol and ethical standards
                consistent with Catholic values.
            </p>
            <p class="narrative" style="margin-bottom: 6px;">
                2. Any amendments to the protocol must be submitted to the ORD for further review.
            </p>
            <p class="narrative" style="margin-bottom: 6px;">
                3. The clearance is valid until
                <strong>{{ optional($certificate->remis_valid_until)->format('F j, Y') ?: '—' }}</strong>.
            </p>
            <p class="narrative" style="margin-bottom: 0;">
                4. The researcher(s) must submit progress and final reports to the ORD for monitoring
                and accreditation purposes.
            </p>
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

<p class="narrative"><strong>Issued by:</strong></p>
<p class="narrative">
    On behalf of the Pasig Catholic College Institutional Research Ethics Committee (REC):
</p>

<table style="width: 100%; border: none; margin-top: 6px;">
    <tr>
        <td style="border: none; padding: 0 0 6px 0;">
            <div class="signer-name" style="text-align: left;">(SGD) {{ $chair['name'] }}</div>
            <div class="signer-title" style="text-align: left;">{{ $chair['title'] }}</div>
        </td>
    </tr>
    <tr>
        <td style="border: none; padding: 0;">
            <div class="signer-name" style="text-align: left;">(SGD) {{ $member['name'] }}</div>
            <div class="signer-title" style="text-align: left;">{{ $member['title'] }}</div>
        </td>
    </tr>
</table>
<p class="narrative" style="margin-top: 6px;">
    Date Issued: {{ optional($certificate->remis_issued_at)->format('F j, Y') }}
</p>

<div class="spacer-sm"></div>

{{-- Scannable verification QR — encodes the public /verify/{token} URL; the Reference Number is the
     manual fallback. --}}
<table style="width: 100%; border: none;">
    <tr>
        <td style="width: 128px; border: none; padding: 0; vertical-align: top;">
            <img
                src="{{ \App\Shared\Documents\Support\QrCode::svgDataUri(route('verify.token', $certificate->remis_qr_token)) }}"
                style="width: 118px; height: 118px;"
                alt="QR code to verify this certificate"
            >
        </td>
        <td style="border: none; padding: 0 0 0 14px; vertical-align: top;">
            <p class="text-small">
                <strong>Verify this certificate.</strong> Scan the QR code with any phone camera, or
                visit the public verification portal and enter Reference No.
                <strong>{{ $certificate->remis_certificate_number }}</strong>.
            </p>
            <p class="text-small">
                Verification confirms only this certificate's authenticity, issue date and validity.
            </p>
        </td>
    </tr>
</table>

</div>
@include('pdf.partials._footer', ['documentId' => 'ORD-EFORM-3RE'])
</body>
</html>
