@php
/**
 * Form 5 — Non-Disclosure Agreement for On-The-Job Trainee, docs/2.1-dpnda-nda-template.md §2.1.b
 *
 * @var \App\Modules\Dpnda\Models\DpndaRecord $record
 * @var \App\Modules\Dpnda\Models\Placement $placement
 */
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $record->tracking_number }}</title>
    @include('pdf.partials._styles')
</head>
<body>
<div class="content-wrapper">

@include('pdf.partials._header', ['formNumber' => 5, 'formTitle' => 'The Non-Disclosure Agreement for On-The-Job Trainee'])

<div class="section-heading">I. Purpose</div>
<p class="narrative">
    This document, titled Non-Disclosure Agreement for On-The-Job Trainee, serves as the
    accompanying NDA for policy DPO-POL-002. It facilitates a paperless signing process for the
    NDA and the submission of NDAs to the DPO.
</p>

<div class="section-heading">II. Scope</div>
<p class="narrative">
    This form must be completed by the secretary or head of the accepting department and
    submitted to the DPO. Department heads are strongly encouraged to ensure that the OJTs
    assigned to them have appropriate signed NDAs on file.
</p>

<table class="question-table">
    <tr>
        <td class="label">TRAINEE FULL NAME:</td>
        <td class="answer">
            <strong>Last:</strong> {{ $placement->trainee_last_name }} |
            <strong>First:</strong> {{ $placement->trainee_first_name }} |
            <strong>M.I.:</strong> {{ $placement->trainee_middle_initial }} |
            <strong>Gender:</strong> {{ $placement->gender }} |
            <strong>Age:</strong> {{ $placement->age }}
        </td>
    </tr>
    <tr><td class="label">ENROLLED IN SCHOOL:</td><td class="answer">{{ $placement->enrolled_school }}</td></tr>
    <tr><td class="label">NO. OF HOURS NEEDED:</td><td class="answer">{{ $placement->hours_needed }}</td></tr>
    <tr>
        <td class="label">DEPT./LEVEL/COURSE/SECTION:</td>
        <td class="answer">
            <strong>Dept:</strong> {{ $placement->department }} |
            <strong>Level:</strong> {{ $placement->level }} |
            <strong>Course:</strong> {{ $placement->course }} |
            <strong>Section:</strong> {{ $placement->section }}
        </td>
    </tr>
    <tr>
        <td class="label">ADDRESS:</td>
        <td class="answer">
            <strong>House No:</strong> {{ $placement->address_house_no }} |
            <strong>Street:</strong> {{ $placement->address_street }} |
            <strong>Bry:</strong> {{ $placement->address_barangay }} |
            <strong>City:</strong> {{ $placement->address_city }}
        </td>
    </tr>
    <tr><td class="label">DEPARTMENT ASSIGNED:</td><td class="answer">{{ $placement->department_assigned }}</td></tr>
    <tr><td class="label">PCC SUPERVISOR/COORDINATOR:</td><td class="answer">{{ $placement->pcc_supervisor }}</td></tr>
    <tr><td class="label">ENDORSED BY:</td><td class="answer">{{ $placement->endorsed_by }}</td></tr>
    <tr>
        <td class="label">DURATION DATE:</td>
        <td class="answer">
            <strong>Start:</strong> {{ $placement->start_date->format('n/j/y') }} |
            <strong>End:</strong> {{ $placement->end_date->format('n/j/y') }}
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

<div class="text-bold" style="margin-bottom: 3px;">OBLIGATIONS OF THE TRAINEE</div>
<table class="bordered checklist">
    <thead>
        <tr><th class="num">#</th><th>Obligation</th><th class="response">Yes</th><th class="response">No</th><th class="response">N/A</th></tr>
    </thead>
    <tbody>
        @foreach([
            ['Adherence to Data Privacy Policies', "I agree to comply with all relevant data privacy laws and the school's privacy policies including this Agreement."],
            ['Maintain Strict Confidentiality', 'I will maintain strict confidentiality of information and shall not disclose, disseminate, or make it available to any third party without the prior written consent of the school.'],
            ['No Recording', 'I will not make any audio, video, photographic, or other recordings of students, staff, or classroom activities without the explicit, prior written permission of the school administration and, where applicable, the consent of parents/guardians.'],
            ['No Identification', 'I will not identify any student by name or any other personally identifiable information in any notes, discussions, assignments, or reports related to the observation, even for academic purposes, unless explicitly anonymized or approved by the school.'],
            ['Proper Handling of Information', 'I will securely handle, store, and properly dispose of any notes or materials containing confidential information created during the observation upon completion of my work immersion period or as instructed by the school.'],
            ['Reporting Breaches', 'I will immediately notify the school administration or their supervising employee of any actual or suspected breach of confidentiality or unauthorized disclosure of confidential information.'],
            ['Adherence to School Policies', "I will abide by all school policies, rules, and regulations, including but not limited to the school's code of conduct, visitor policies, and any other guidelines provided by the school or supervising employees."],
        ] as $i => [$category, $body])
            <tr>
                <td class="num">{{ $i + 1 }}</td>
                <td><span class="text-bold">{{ $category }}</span><br>{{ $body }}</td>
                <td class="response"><span class="response-circle filled"></span></td>
                <td class="response"><span class="response-circle"></span></td>
                <td class="response"><span class="response-circle"></span></td>
            </tr>
        @endforeach
    </tbody>
</table>

<div class="spacer-sm"></div>

<table class="bordered">
    <tbody>
        <tr>
            <td style="width: 30px; text-align: center;"><span class="response-circle filled" style="border-radius: 0;"></span></td>
            <td>I understand that this agreement shall take effect immediately upon signing by all Parties concerned and shall remain in force for the duration stated above.</td>
        </tr>
        <tr>
            <td style="width: 30px; text-align: center;"><span class="response-circle filled" style="border-radius: 0;"></span></td>
            <td>I understand that either party may terminate this MOA by providing a written notice to the other party at least five (5) days prior to the intended date of termination, stating the reason(s) for such termination.</td>
        </tr>
    </tbody>
</table>

<div class="spacer-sm"></div>

<p class="text-bold" style="margin-bottom: 6px;">CONFORME:</p>

<table class="signature-table">
    <tr>
        <td style="text-align: center;">
            @if ($record->trainee_signature_image)
                <img src="{{ $record->trainee_signature_image }}" style="height: 40px; margin-top: 8px;" alt="signature">
            @else
                <div style="font-size: 7pt; font-style: italic;">(e-signature)</div>
            @endif
            <div style="border-top: 1.5px solid #000; margin-top: 4px; margin-bottom: 3px;"></div>
            <div class="signer-name">{{ $record->trainee_signature_id }}</div>
            <div class="signer-title">TRAINEE</div>
        </td>
        <td style="text-align: center;">
            @if ($record->coordinator_signature_image)
                <img src="{{ $record->coordinator_signature_image }}" style="height: 40px; margin-top: 8px;" alt="signature">
            @else
                <div style="font-size: 7pt; font-style: italic;">(e-signature)</div>
            @endif
            <div style="border-top: 1.5px solid #000; margin-top: 4px; margin-bottom: 3px;"></div>
            <div class="signer-name">{{ $record->coordinator_signature_id }}</div>
            <div class="signer-title">DEPARTMENT HEAD</div>
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

@include('pdf.partials._version_control', ['initialVersionDate' => 'April 17, 2026'])

<div class="spacer-sm"></div>

@include('pdf.partials._approval')

</div>
@include('pdf.partials._footer', ['documentId' => 'DPO-EFORM-5'])
</body>
</html>
