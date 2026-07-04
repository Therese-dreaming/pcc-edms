@php
/**
 * DPO EFORM 2 — Non-Disclosure Agreement
 *
 * Required variables:
 * @var \App\Models\DpoEform $eform
 * @var \App\Enums\DpoEformType $type
 */
$d = $eform->form_data ?? [];
$obligations = $d['obligations'] ?? [];
$teamMembers = $d['team_members'] ?? [];
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
{{-- PAGE 1 — Purpose, scope, details, obligations, team signatures    --}}
{{-- ════════════════════════════════════════════════════════════════ --}}
@include('dpo-eforms._page_header', ['type' => $type, 'pageNum' => 1])

<div class="section-heading">I. Purpose</div>
<p class="narrative">
    This form, entitled Non-Disclosure Agreement Form 2, will be the accompanying application form for policy DPO-POL-005. All team members must sign the form if a group conducts the research. After gaining access to the Electronic Document Management System (EDMS), the research group leader must facilitate the signing process. Please note that clearance will only be released if the non-disclosure agreement is completed.
</p>

<div class="section-heading">II. Scope</div>
<p class="narrative">
    This non-disclosure agreement is applicable to individuals conducting research with human subjects, collecting data from school resources or students, and using school property or equipment for data collection. This form is not a stand-alone document but part of the procedure of DPO-POL-005. It must be accomplished electronically by the researcher.
</p>

<div class="spacer-sm"></div>

{{-- Questions in two-column format: Label | Answer (similar to Form 1) --}}
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

{{-- Obligations Checklist with CIRCLES --}}
<div class="text-bold" style="margin-bottom: 4px;">OBLIGATIONS OF THE RESEARCHER/S</div>
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
                ['1', 'I will use the data gathered solely for the purpose of conducting the study.'],
                ['2', 'I will not disclose, publish, or otherwise disseminate confidential information to any third party without the prior written consent of the school.'],
                ['3', 'I shall not use the information for any commercial, personal, or other unauthorized purpose.'],
                ['4', 'I will anonymize participants\' identities and responses and will keep it confidential.'],
                ['5', 'I will maintain reasonable security measures in the storage such as password protected files or other appropriate measures.'],
                ['6', 'I will avoid exposing participants to harm or risk.'],
                ['7', 'Upon completion of the study, I will return or destroy all confidential information and all copies at the school\'s request.'],
                ['8', 'I will promptly share a copy of the study in PDF form by uploading it in the EDMS, if the school requests it.'],
            ];
        @endphp
        @foreach($obItems as [$num, $text])
            @php $resp = $obligations[$num] ?? ''; @endphp
            <tr>
                <td class="num">{{ $num }}</td>
                <td>{{ $text }}</td>
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

@include('dpo-eforms._certification')

<div class="spacer-sm"></div>

{{-- Team member signatures --}}
<div class="text-bold" style="margin-bottom: 4px;">Researchers</div>
<table class="bordered">
    <thead>
        <tr>
            <th style="width: 40%;">Name</th>
            <th style="width: 20%;">Role</th>
            <th style="width: 40%;">Signature</th>
        </tr>
    </thead>
    <tbody>
        @php
            // Default: show at least the leader row + 2 empty rows
            $rows = !empty($teamMembers) ? $teamMembers : [['name' => $d['researcher_name'] ?? '', 'role' => 'Leader']];
            for ($i = count($rows); $i < 3; $i++) {
                $rows[] = ['name' => '', 'role' => 'Member'];
            }
        @endphp
        @foreach($rows as $i => $member)
            <tr>
                <td>{{ ($i + 1) . '. ' . ($member['name'] ?? '') }}</td>
                <td>{{ $member['role'] ?? 'Member' }}</td>
                <td>
                    @if(!empty($member['signature_image_path']) && \Illuminate\Support\Facades\Storage::disk('documents')->exists($member['signature_image_path']))
                        <img src="{{ storage_path('app/documents/' . $member['signature_image_path']) }}" style="max-height: 30px; max-width: 120px;" alt="" />
                    @else
                        &nbsp;
                    @endif
                </td>
            </tr>
        @endforeach
    </tbody>
</table>

<div class="spacer-md"></div>

{{-- Version control and approval on same page if space allows --}}
@include('dpo-eforms._version_control', ['eform' => $eform])

<div class="spacer-md"></div>

@include('dpo-eforms._approval')

@include('dpo-eforms._page_footer', ['type' => $type, 'pageNum' => 1])

</body>
</html>
