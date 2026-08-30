@php
/**
 * Data Privacy (DPREQ) Clearance Certificate — Form 3, issued by the DPO. Single-signed by the
 * DPO Officer. This is a standalone Data Privacy document; Research Ethics (REMIS) issues its own
 * certificates entirely separately and is not referenced here (stakeholder 2026-07-28).
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

@include('pdf.partials._header', ['formNumber' => '3-DP', 'formTitle' => 'Data Privacy Clearance'])

<div class="section-heading">Control Number</div>
<p class="narrative">
    <strong style="font-size: 11pt; letter-spacing: 0.5px;">{{ $certificate->dpreq_certificate_number }}</strong>
    &mdash; unique, system-issued, and non-reusable. Use this number (or the QR token below) to
    verify this clearance at the public verification portal.
</p>

<div class="section-heading">I. Purpose</div>
<p class="narrative">
    This is the Data Privacy Clearance issued by the Data Privacy Office. It certifies that the
    research below has satisfied the data-privacy requirements reviewed under the DPREQ process.
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
    <tr><td class="label">DPREQ CONTROL NUMBER:</td><td class="answer">{{ $certificate->dpreq_certificate_number }}</td></tr>
    <tr><td class="label">ISSUED:</td><td class="answer">{{ optional($certificate->dpreq_issued_at)->format('n/j/y') }}</td></tr>
    <tr><td class="label">VALID UNTIL:</td><td class="answer">{{ optional($certificate->dpreq_valid_until)->format('n/j/y') }}</td></tr>
</table>

<div class="spacer-sm"></div>

<table class="bordered" style="font-size: 8pt;">
    <tr>
        <td style="padding: 8px; border: 1px solid #000;">
            <div style="font-weight: bold; margin-bottom: 6px; font-family: 'Aptos', Arial, Helvetica, sans-serif;">Remarks:</div>
            <p class="narrative" style="margin-bottom: 6px;">
                1. Having completed the data-privacy review procedures and submitted all required
                documents, the undersigned issues this Data Privacy Clearance, effective only for
                the period specified above.
            </p>
            <p class="narrative" style="margin-bottom: 8px;">
                2. Failing to adhere to your data-privacy obligations breaches your signed
                non-disclosure agreement. The school reserves the right to revoke this clearance
                at any time if the agreement is violated.
            </p>
            <div class="narrative" style="margin-bottom: 8px;">Respectfully yours,</div>

            <table style="width: 100%; border: none; margin-top: 10px;">
                <tr>
                    <td style="width: 50%; border: none; padding: 0; vertical-align: top;">
                        <div style="border-top: 1.5px solid #000; width: 200px; margin-top: 30px; margin-bottom: 4px;"></div>
                        <div class="signer-name" style="text-align: left;">{{ $certificate->dpoSignedBy?->name }}</div>
                        <div class="signer-title" style="text-align: left;">{{ config('pdf.dpo_officer_title') }}</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

{{-- Scannable verification QR (docs/3.1) — encodes the public /verify/{token} URL. The Control
     Number below is the manual fallback; the raw token is deliberately not printed. --}}
<table style="width: 100%; border: none;">
    <tr>
        <td style="width: 128px; border: none; padding: 0; vertical-align: top;">
            <img
                src="{{ \App\Shared\Documents\Support\QrCode::svgDataUri(route('verify.token', $certificate->dpreq_qr_token)) }}"
                style="width: 118px; height: 118px;"
                alt="QR code to verify this clearance"
            >
        </td>
        <td style="border: none; padding: 0 0 0 14px; vertical-align: top;">
            <p class="text-small">
                <strong>Verify this clearance.</strong> Scan the QR code with any phone camera, or
                visit the public verification portal and enter Control No.
                <strong>{{ $certificate->dpreq_certificate_number }}</strong>.
            </p>
            <p class="text-small">
                Verification confirms only this certificate's authenticity, issue date and validity.
            </p>
        </td>
    </tr>
</table>

<div class="spacer-md"></div>

@include('pdf.partials._approval')

</div>
@include('pdf.partials._footer', ['documentId' => 'DPO-EFORM-3DP'])
</body>
</html>
