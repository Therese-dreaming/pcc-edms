@php
/**
 * DPO EFORM 3 — Data Privacy and Research Ethics Clearance
 *
 * Required variables:
 * @var \App\Models\DpoEform $eform
 * @var \App\Enums\DpoEformType $type
 */
$d = $eform->form_data ?? [];
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
{{-- Single page layout — maximize space usage                        --}}
{{-- ════════════════════════════════════════════════════════════════ --}}
@include('dpo-eforms._page_header', ['type' => $type, 'pageNum' => 1])

<div class="spacer-sm"></div>

<div class="section-heading">I. Purpose</div>
<p class="narrative">
    This form, entitled Data Privacy and Research Ethics Clearance Form 3, will be the approval form for policy DPO-POL-005. It will be accomplished by the DPO and the research ethics head. The clearance can be downloaded and printed by the researcher after approval.
</p>

<div class="section-heading">II. Scope</div>
<p class="narrative">
    This data privacy and research ethics clearance form will be released to the researcher upon completion of the necessary document requirements. This form will only be accomplished by the DPO and the research ethics head.
</p>

<div class="spacer-sm"></div>

{{-- Questions in two-column format: Label | Answer (consistent with Form 1 & 2) --}}
<table class="question-table">
    <tr>
        <td class="label">RESEARCH TITLE:</td>
        <td class="answer">{{ $d['research_title'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">RESEARCHER OR TEAM LEAD:</td>
        <td class="answer">{{ $d['researcher_name'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">TOTAL NUMBER PER GROUP:</td>
        <td class="answer">{{ $d['group_size'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">ADVISER'S NAME:</td>
        <td class="answer">{{ $d['adviser_name'] ?? '' }}</td>
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
        <td class="label">RESPONDENTS:</td>
        <td class="answer">{{ $d['respondents'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">TOTAL RESPONDENTS:</td>
        <td class="answer">{{ $d['target_respondents'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">DATA COLLECTION METHOD:</td>
        <td class="answer">{{ $d['data_collection_method'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">DATA CAPTURING TOOL:</td>
        <td class="answer">{{ $d['data_capturing_tool'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">RESEARCH DURATION:</td>
        <td class="answer">
            <strong>Start:</strong> {{ $d['research_start'] ?? '' }} | 
            <strong>End:</strong> {{ $d['research_end'] ?? '' }}
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

{{-- Remarks in a bordered table (Courier New font) with signatures inside --}}
<table class="bordered" style="font-family: 'Courier New', monospace; font-size: 8pt;">
    <tr>
        <td style="padding: 8px; border: 1px solid #000;">
            <div style="font-weight: bold; margin-bottom: 6px;">Remarks:</div>
            
            <p style="margin-bottom: 6px; line-height: 1.4;">
                1. Having completed all the procedures and submitted all the required documents, the undersigned issues this data privacy and ethical clearance form effective only to the period specified in the research duration.
            </p>
            
            <p style="margin-bottom: 6px; line-height: 1.4;">
                2. Please remember that failing to adhere to your obligations regarding data privacy and ethical research procedures breaches your signed non-disclosure agreement. The school reserves the right to revoke this clearance at any time if the agreement is violated.
            </p>

            @if(!empty($d['custom_remarks']))
                <p style="margin-bottom: 6px; line-height: 1.4;">{{ $d['custom_remarks'] }}</p>
            @endif

            <p style="margin-bottom: 8px; line-height: 1.4;">
                Thank you very much and we wish you the best in your research endeavors!<br>
                <strong>That in all things, God may be glorified!</strong>
            </p>

            <div style="margin-bottom: 8px; font-size: 8pt;">Respectfully yours,</div>

            {{-- Signatures side by side within the table --}}
            <table style="width: 100%; border: none; margin-top: 10px;">
                <tr>
                    <td style="width: 50%; border: none; padding: 0; vertical-align: top;">
                        <div style="border-top: 1.5px solid #000; width: 200px; margin-top: 30px; margin-bottom: 4px;"></div>
                        <div style="font-weight: bold; font-size: 8pt;">{{ config('remis.dpo_eforms.dpo_officer') }}</div>
                        <div style="font-size: 8pt;">DPO Officer</div>
                    </td>
                    <td style="width: 50%; border: none; padding: 0; vertical-align: top;">
                        <div style="border-top: 1.5px solid #000; width: 200px; margin-top: 30px; margin-bottom: 4px;"></div>
                        <div style="font-weight: bold; font-size: 8pt;">{{ config('remis.dpo_eforms.ethics_head') }}</div>
                        <div style="font-size: 8pt;">Research Ethics Head</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

<div class="spacer-sm"></div>

@include('dpo-eforms._version_control', ['eform' => $eform])

<div class="spacer-sm"></div>

@include('dpo-eforms._approval')

@include('dpo-eforms._page_footer', ['type' => $type, 'pageNum' => 1])

</body>
</html>
