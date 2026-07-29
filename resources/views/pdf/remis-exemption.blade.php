@php
/**
 * Certificate of Exemption from Research Ethics Clearance — issued by the Research Ethics Committee
 * when the ethics decision is "exempted". Content follows the official template
 * (reqs/REMIS-certs/REC-Exemption-Certificate.pdf, stakeholder 2026-07-28); the system adds a
 * reference (control) number and QR verification.
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

@include('pdf.partials._header', ['formNumber' => '3-RE', 'formTitle' => 'Certificate of Exemption from Research Ethics Clearance'])

<p class="narrative">This certifies that the research study entitled:</p>
<p class="narrative"><strong>&ldquo;{{ $r->research_title }}&rdquo;</strong></p>

<p class="narrative">
    conducted by <strong>{{ $r->applicant->name }}</strong> under the supervision of
    <strong>{{ $r->adviser_name }}</strong>, has been reviewed by the Institutional Research Ethics
    Committee (IREC) of Pasig Catholic College.
</p>

<p class="narrative">
    The Committee has determined that the study is <strong>exempt from full ethics clearance</strong>
    in accordance with the Philippine National Ethical Guidelines for Health and Health-Related
    Research (PHREB, 2017), the Data Privacy Act of 2012 (R.A. 10173), relevant CHED Memorandum
    Orders, DepEd issuances, and other institutional, local, and national policies governing research
    ethics and compliance.
</p>

<p class="narrative">
    This certificate serves as the official record that the study has undergone ethics review and is
    recognized as <strong>exempt from full clearance</strong>.
</p>

<table class="question-table">
    <tr><td class="label">DATE OF REVIEW:</td><td class="answer">{{ optional($certificate->remis_issued_at)->format('F j, Y') }}</td></tr>
    <tr><td class="label">REFERENCE NO.:</td><td class="answer">{{ $certificate->remis_certificate_number }}</td></tr>
    <tr><td class="label">ISSUED:</td><td class="answer">{{ optional($certificate->remis_issued_at)->format('F j, Y') }}</td></tr>
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
                Verification confirms only this certificate's authenticity and issue date.
            </p>
        </td>
    </tr>
</table>

</div>
@include('pdf.partials._footer', ['documentId' => 'ORD-EFORM-3RE-EX'])
</body>
</html>
