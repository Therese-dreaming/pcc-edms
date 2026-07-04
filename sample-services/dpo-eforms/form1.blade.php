@php
/**
 * DPO EFORM 1 — Online Application for Data Privacy and Ethics Review
 *
 * Required variables:
 * @var \App\Models\DpoEform $eform
 * @var \App\Enums\DpoEformType $type
 */
$d = $eform->form_data ?? [];
$checklist = $d['checklist'] ?? [];
@endphp

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $eform->document_id }}</title>
    @include('dpo-eforms._styles', ['type' => $type])
</head>
<body>

<div class="content-wrapper">

{{-- ════════════════════════════════════════════════════════════════ --}}
{{-- PAGE 1 — Research details + review checklist                       --}}
{{-- ════════════════════════════════════════════════════════════════ --}}
@include('dpo-eforms._page_header', ['type' => $type, 'pageNum' => 1])

{{-- Questions in two-column format: Label | Answer --}}
<table class="question-table">
    <tr>
        <td class="label">Research Title?</td>
        <td class="answer">{{ $d['research_title'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">Researcher's name or group lead?</td>
        <td class="answer">{{ $d['researcher_name'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">How many are doing the research?</td>
        <td class="answer">
            @foreach([1, 2, 3, 4, 5, 6] as $n)
                <span class="checkbox @if((int)($d['group_size'] ?? 0) === $n) checked @endif"></span>
                <span class="checkbox-label">{{ $n }}</span>
            @endforeach
            &nbsp;&nbsp;(others pls specify): {{ $d['group_size_other'] ?? '' }}
        </td>
    </tr>
    <tr>
        <td class="label">Adviser's name?</td>
        <td class="answer">{{ $d['adviser_name'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">Dept./Level/Course/Section:</td>
        <td class="answer">
            <strong>Dept:</strong> {{ $d['department'] ?? '' }} | 
            <strong>Level:</strong> {{ $d['level'] ?? '' }} | 
            <strong>Course:</strong> {{ $d['course'] ?? '' }} | 
            <strong>Section:</strong> {{ $d['section'] ?? '' }}
        </td>
    </tr>
    <tr>
        <td class="label">Who are your respondents?</td>
        <td class="answer">{{ $d['respondents'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">How many are your target respondents?</td>
        <td class="answer">{{ $d['target_respondents'] ?? '' }}</td>
    </tr>
    <tr>
        <td class="label">Data collection method?</td>
        <td class="answer">
            @php
                $methodOptions = ['Survey form', 'Interview', 'Mixed', 'Observation'];
                $selMethod = $d['data_collection_method'] ?? '';
            @endphp
            @foreach($methodOptions as $opt)
                <span class="checkbox @if(strcasecmp($selMethod, $opt) === 0) checked @endif"></span>
                <span class="checkbox-label">{{ $opt }}</span>
            @endforeach
        </td>
    </tr>
    <tr>
        <td class="label">Data capturing tool?</td>
        <td class="answer">
            @php
                $toolOptions = ['Electronic form', 'Paper-based', 'Voice recording', 'Video recording'];
                $selTool = $d['data_capturing_tool'] ?? '';
            @endphp
            @foreach($toolOptions as $opt)
                <span class="checkbox @if(strcasecmp($selTool, $opt) === 0) checked @endif"></span>
                <span class="checkbox-label">{{ $opt }}</span>
            @endforeach
        </td>
    </tr>
    <tr>
        <td class="label">Duration of the research?</td>
        <td class="answer">
            <strong>Start:</strong> {{ $d['research_start'] ?? '' }} | 
            <strong>End:</strong> {{ $d['research_end'] ?? '' }}
        </td>
    </tr>
</table>

<div class="spacer-sm"></div>

{{-- Review Checklist --}}
<div class="text-bold" style="margin-bottom: 4px;">Review Checklist:</div>
<table class="bordered checklist">
    <thead>
        <tr>
            <th class="num">#</th>
            <th>Item</th>
            <th class="response">Yes</th>
            <th class="response">No</th>
            <th class="response">N/A</th>
        </tr>
    </thead>
    <tbody>
        @php
            $items = [
                ['1', 'Will you have minors as participants? (Minors are respondents below 18 years old.) If yes: a. Upload your parental consent sample letter into the EDMS. b. After collecting the parent\'s reply slips, take pictures or scan those slips and upload them in the EDMS.'],
                ['2', 'Do you have an approved letter signed by the head of your target participants? If No: a. Write first a formal request letter addressed to the head of your target participants. b. After approval, scan the letter and upload it to the EDMS.'],
                ['3', 'Will the study involve voluntary participation of all respondents?'],
                ['4', 'Will the participants\' identities and responses remain confidential?'],
                ['5', 'Will the participants be free to withdraw anytime without penalty?'],
                ['6', 'Will the study avoid exposing participants to harm or risk?'],
                ['7', 'Will the collected data be used strictly for academic purposes?'],
                ['8', 'Have you uploaded the following documents in the Electronic Data Management System or EDMS?'],
                ['8.1', 'Copy of the approved formal letter request from the head of your target respondents?'],
                ['8.2', 'Copy of your chapter 1 in PDF form?'],
                ['8.3', 'Copy of your questionnaire in PDF form?'],
                ['8.4', 'Copy of endorsement letter from your adviser?'],
            ];
        @endphp
        @foreach($items as [$num, $text])
            @php
                $resp = $checklist[$num] ?? '';
            @endphp
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

<p class="text-small" style="margin-top: 4px; margin-bottom: 4px;">
    If you haven't done so already, please secure a copy of the above documents and upload them to the EDMS.
</p>

@include('dpo-eforms._certification')

<div class="spacer-md"></div> {{-- More space after certification --}}

{{-- Keep everything together on page 1 --}}
<div class="keep-together">

{{-- Signature Section IN TABLE --}}
<table class="signature-table" style="margin-top: 6px; margin-bottom: 6px;">
    <tr>
        <td>
            <div class="signature-label">Researcher's name:</div>
            <div>{{ $d['researcher_name'] ?? '' }}</div>
            
            <div class="signature-label" style="margin-top: 6px;">Researcher's signature:</div>
            @if(!empty($d['researcher_signature']['image_path']) && \Illuminate\Support\Facades\Storage::disk('documents')->exists($d['researcher_signature']['image_path']))
                <img src="{{ storage_path('app/documents/' . $d['researcher_signature']['image_path']) }}" style="max-height: 35px; max-width: 180px;" alt="Signature" />
            @else
                <div style="height: 35px;"></div>
            @endif
            
            <div class="signature-label" style="margin-top: 3px;">Date signed:</div>
            <div>{{ $d['researcher_date_signed'] ?? $d['date_signed'] ?? '' }}</div>
        </td>
        
        <td>
            <div class="signature-label">Adviser's name:</div>
            <div>{{ $d['adviser_name'] ?? '' }}</div>
            
            <div class="signature-label" style="margin-top: 6px;">Adviser's signature:</div>
            @if(!empty($d['adviser_signature']['image_path']) && \Illuminate\Support\Facades\Storage::disk('documents')->exists($d['adviser_signature']['image_path']))
                <img src="{{ storage_path('app/documents/' . $d['adviser_signature']['image_path']) }}" style="max-height: 35px; max-width: 180px;" alt="Signature" />
            @else
                <div style="height: 35px;"></div>
            @endif
            
            <div class="signature-label" style="margin-top: 3px;">Date signed:</div>
            <div>{{ $d['adviser_date_signed'] ?? $d['date_signed'] ?? '' }}</div>
        </td>
    </tr>
</table>

<div class="spacer-md"></div> {{-- More space after signatures --}}

<div style="margin-top: 8px; margin-bottom: 8px;">
    @include('dpo-eforms._version_control', ['eform' => $eform])
</div>

<div class="spacer-md"></div> {{-- More space after version control --}}

@include('dpo-eforms._approval')

</div>{{-- End keep-together --}}

</div>

@include('dpo-eforms._page_footer', ['type' => $type, 'pageNum' => 1])

{{-- ════════════════════════════════════════════════════════════════ --}}
{{-- PAGE 2 — Only if needed (usually everything fits on page 1)      --}}
{{-- ════════════════════════════════════════════════════════════════ --}}

@if(false) {{-- Page 2 disabled - everything should fit on page 1 --}}

<div class="page-break"></div>

<div class="content-wrapper">

@include('dpo-eforms._page_header', ['type' => $type, 'pageNum' => 2])

<div class="spacer-md"></div>

@include('dpo-eforms._version_control', ['eform' => $eform])

<div class="spacer-md"></div>

@include('dpo-eforms._approval')

</div>

@include('dpo-eforms._page_footer', ['type' => $type, 'pageNum' => 2])

@endif

</body>
</html>
