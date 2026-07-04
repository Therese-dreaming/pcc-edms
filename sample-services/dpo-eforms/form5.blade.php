@php
/**
 * DPO EFORM 5 — Non-Disclosure Agreement for On-The-Job Trainee
 *
 * Required variables:
 * @var \App\Models\DpoEform $eform
 * @var \App\Enums\DpoEformType $type
 */
$d = $eform->form_data ?? [];
$obligations = $d['obligations'] ?? [];
$addr = $d['address'] ?? [];
$prefixId = $type->documentIdPrefix();
@endphp

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $eform->document_id }}</title>
    @include('dpo-eforms._styles', ['type' => $type])
</head>
<body>

{{-- ════════════════════════════════════════════════════════════════ --}}
{{-- Flowing layout — content splits naturally at the page boundary   --}}
{{-- ════════════════════════════════════════════════════════════════ --}}
@include('dpo-eforms._page_header', ['type' => $type, 'pageNum' => 1])

<div class="spacer-sm"></div>

<div class="section-heading">I. Purpose</div>
<p class="narrative">
    This document, titled Non-Disclosure Agreement for On-The-Job Trainee, serves as the accompanying NDA for policy DPO-POL-002. It facilitates a paperless signing process for the NDA and the submission of NDAs to the DPO. This replaces NDA-4, which required manual signing and submission of NDAs for OJTs.
</p>

<div class="section-heading">II. Scope</div>
<p class="narrative">
    This form must be completed by the secretary or head of the accepting department and submitted to the DPO. Department heads are strongly encouraged to ensure that the OJTs assigned to them have appropriate signed NDAs on file.
</p>

<div class="spacer-sm"></div>

{{-- Trainee details in two-column format similar to other forms --}}
<table class="question-table">
    <tr>
        <td class="label">TRAINEE FULL NAME:</td>
        <td class="answer">
            <strong>Last:</strong> {{ $d['trainee_last'] ?? $d['last'] ?? '' }} | 
            <strong>First:</strong> {{ $d['trainee_first'] ?? $d['first'] ?? '' }} | 
            <strong>M.I.:</strong> {{ $d['trainee_middle_initial'] ?? $d['middle_initial'] ?? '' }} | 
            <strong>Gender:</strong> {{ $d['gender'] ?? '' }} | 
            <strong>Age:</strong> {{ $d['age'] ?? '' }}
        </td>
    </tr>
    <tr>
        <td class="label">ENROLLED IN SCHOOL:</td>
        <td class="answer">{{ $d['enrolled_school'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">NO. OF HOURS NEEDED:</td>
        <td class="answer">{{ $d['hours_needed'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">DEPT./LEVEL/COURSE/SECTION:</td>
        <td class="answer">
            <strong>Dept:</strong> {{ $d['department'] ?? '' }} | 
            <strong>Level:</strong> {{ $d['level'] ?? '' }} | 
            <strong>Course:</strong> {{ $d['course'] ?? '' }} | 
            <strong>Section:</strong> {{ $d['section'] ?? '' }}
        </td>
    </tr>
    <tr>
        <td class="label">ADDRESS:</td>
        <td class="answer">
            <strong>House No:</strong> {{ $addr['house_no'] ?? '' }} | 
            <strong>Street:</strong> {{ $addr['street'] ?? '' }} | 
            <strong>Bry:</strong> {{ $addr['barangay'] ?? '' }} | 
            <strong>City:</strong> {{ $addr['city'] ?? '' }}
        </td>
    </tr>
    <tr>
        <td class="label">DEPARTMENT ASSIGNED:</td>
        <td class="answer">{{ $d['department_assigned'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">PCC SUPERVISOR/COORDINATOR:</td>
        <td class="answer">{{ $d['pcc_supervisor'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">ENDORSED BY:</td>
        <td class="answer">{{ $d['endorsed_by'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">DURATION DATE:</td>
        <td class="answer">
            <strong>Start:</strong> {{ $d['duration_start'] ?? '' }} | 
            <strong>End:</strong> {{ $d['duration_end'] ?? '' }}
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

{{-- Obligations Checklist — table may flow across page boundary --}}
<div class="text-bold" style="margin-bottom: 3px; margin-top: 2px;">OBLIGATIONS OF THE TRAINEE</div>
<table class="bordered checklist">
    <thead>
        <tr>
            <th class="num">#</th>
            <th>Obligation</th>
            <th class="response">Yes</th>
            <th class="response">No</th>
            <th class="response">N/A</th>
        </tr>
    </thead>
    <tbody>
        @php
            $obItems = [
                ['1', "Adherence to Data Privacy Policies\nI agree to comply with all relevant data privacy laws and the school's privacy policies including this Agreement."],
                ['2', "Maintain Strict Confidentiality\nI will maintain strict confidentiality of information and shall not disclose, disseminate, or make it available to any third party without the prior written consent of the school."],
                ['3', "No Recording\nI will not make any audio, video, photographic, or other recordings of students, staff, or classroom activities without the explicit, prior written permission of the school administration and, where applicable, the consent of parents/guardians."],
                ['4', "No Identification\nI will not identify any student by name or any other personally identifiable information in any notes, discussions, assignments, or reports related to the observation, even for academic purposes, unless explicitly anonymized or approved by the school."],
                ['5', "Proper Handling of Information\nI will securely handle, store, and properly dispose of any notes or materials containing confidential information created during the observation upon completion of my work immersion period or as instructed by the school."],
                ['6', "Reporting Breaches\nI will immediately notify the school administration or their supervising employee of any actual or suspected breach of confidentiality or unauthorized disclosure of confidential information."],
                ['7', "Adherence to School Policies\nI will abide by all school policies, rules, and regulations, including but not limited to the school's code of conduct, visitor policies, and any other guidelines provided by the school or supervising employees."],
            ];
        @endphp
        @foreach($obItems as [$num, $text])
            @php
                $resp = $obligations[$num] ?? '';
                // Split category header from body
                $parts = explode("\n", $text, 2);
                $category = $parts[0] ?? '';
                $body = $parts[1] ?? $text;
            @endphp
            <tr>
                <td class="num">{{ $num }}</td>
                <td>
                    <span class="text-bold">{{ $category }}</span><br>
                    {{ $body }}
                </td>
                <td class="response">
                    <span class="response-circle @if($resp === 'yes') filled @endif"></span>
                </td>
                <td class="response">
                    <span class="response-circle @if($resp === 'no') filled @endif"></span>
                </td>
                <td class="response">
                    <span class="response-circle @if($resp === 'not_applicable') filled @endif"></span>
                </td>
            </tr>
        @endforeach
    </tbody>
</table>

<div class="spacer-sm"></div>

{{-- Understanding/Agreement checklist items in Courier New --}}
<table class="bordered" style="font-family: 'Courier New', monospace; font-size: 8pt;">
    <tbody>
        <tr>
            <td style="padding: 6px; border: 1px solid #000; vertical-align: top; width: 30px; text-align: center;">
                @php $agreement1 = $d['agreement_1'] ?? false; @endphp
                <span class="checkbox @if($agreement1) checked @endif"></span>
            </td>
            <td style="padding: 6px; border: 1px solid #000;">
                I understand that this agreement shall take effect immediately upon signing by all Parties concerned and shall remain in force for the duration stated above.
            </td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #000; vertical-align: top; width: 30px; text-align: center;">
                @php $agreement2 = $d['agreement_2'] ?? false; @endphp
                <span class="checkbox @if($agreement2) checked @endif"></span>
            </td>
            <td style="padding: 6px; border: 1px solid #000;">
                I understand that either party may terminate this MOA by providing a written notice to the other party at least five (5) days prior to the intended date of termination, stating the reason(s) for such termination.
            </td>
        </tr>
    </tbody>
</table>

<div class="spacer-sm"></div>

<p class="text-bold" style="margin-bottom: 6px; margin-top: 2px;">CONFORME:</p>

{{-- Conforme signatures in table format: Trainee (left) | Department Head (right) --}}
<table class="signature-table" style="margin-top: 6px; margin-bottom: 6px;">
    <tr>
        <td style="text-align: center;">
            @if(!empty($d['conforme_trainee']['image_path']) && \Illuminate\Support\Facades\Storage::disk('documents')->exists($d['conforme_trainee']['image_path']))
                <img src="{{ storage_path('app/documents/' . $d['conforme_trainee']['image_path']) }}" style="max-height: 35px; max-width: 180px; margin-bottom: 2px;" alt="" />
            @else
                <div style="height: 35px;"></div>
            @endif
            <div style="font-size: 7pt; font-style: italic;">(e-signature)</div>
            <div style="border-top: 1.5px solid #000; margin-top: 10px; margin-bottom: 3px;"></div>
            <div class="signer-name">{{ $d['conforme_trainee']['name'] ?? ($d['trainee_last'] ?? '') . ' ' . ($d['trainee_first'] ?? '') }}</div>
            <div class="signer-title">TRAINEE</div>
        </td>
        
        <td style="text-align: center;">
            @if(!empty($d['conforme_dept_head']['image_path']) && \Illuminate\Support\Facades\Storage::disk('documents')->exists($d['conforme_dept_head']['image_path']))
                <img src="{{ storage_path('app/documents/' . $d['conforme_dept_head']['image_path']) }}" style="max-height: 35px; max-width: 180px; margin-bottom: 2px;" alt="" />
            @else
                <div style="height: 35px;"></div>
            @endif
            <div style="font-size: 7pt; font-style: italic;">(e-signature)</div>
            <div style="border-top: 1.5px solid #000; margin-top: 10px; margin-bottom: 3px;"></div>
            <div class="signer-name">{{ $d['conforme_dept_head']['name'] ?? '(Name of Department Head)' }}</div>
            <div class="signer-title">DEPARTMENT HEAD</div>
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

@include('dpo-eforms._version_control', ['eform' => $eform])

<div class="spacer-sm"></div>

@include('dpo-eforms._approval')

@include('dpo-eforms._page_footer', ['type' => $type, 'pageNum' => 1])

</body>
</html>
