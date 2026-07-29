@php
/**
 * FRS §VI — Deficiency Notice, auto-generated when an application is screened Incomplete or
 * Returned for Compliance.
 *
 * @var \App\Modules\Remis\Models\RemisApplication $application
 * @var \App\Modules\Remis\Models\ScreeningChecklist $checklist
 */
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Deficiency Notice — {{ $application->tracking_number }}</title>
    @include('pdf.partials._styles')
</head>
<body>
<div class="content-wrapper">

@include('pdf.partials._header', ['formNumber' => 'DN', 'formTitle' => 'Administrative Screening — Deficiency Notice'])

<table class="question-table">
    <tr><td class="label">TRACKING NUMBER:</td><td class="answer">{{ $application->tracking_number }}</td></tr>
    <tr><td class="label">RESEARCH TITLE:</td><td class="answer">{{ $application->researchApplication->research_title }}</td></tr>
    <tr><td class="label">RESEARCHER:</td><td class="answer">{{ $application->researchApplication->applicant->name }}</td></tr>
    <tr><td class="label">SCREENING OUTCOME:</td><td class="answer">{{ \Illuminate\Support\Str::headline($checklist->decision) }}</td></tr>
    <tr><td class="label">DATE:</td><td class="answer">{{ $checklist->screened_at->format('F j, Y') }}</td></tr>
</table>

<div class="spacer-sm"></div>

<div class="section-heading">Deficiencies to Address</div>
<p class="narrative">
    Administrative screening found the following items outstanding. Please supply or correct each,
    then resubmit the application.
</p>

<table class="bordered" style="font-size: 9pt;">
    <thead><tr><th style="width: 8%;">#</th><th>Outstanding item</th></tr></thead>
    <tbody>
        @forelse ($checklist->deficiencies() as $i => $item)
            <tr><td>{{ $i + 1 }}</td><td>{{ $item }}</td></tr>
        @empty
            <tr><td colspan="2">See the screening comments below.</td></tr>
        @endforelse
    </tbody>
</table>

@if ($checklist->comments)
    <div class="spacer-sm"></div>
    <div class="section-heading">Screening Comments</div>
    <p class="narrative">{{ $checklist->comments }}</p>
@endif

<div class="spacer-md"></div>

<table style="width: 100%; border: none;">
    <tr>
        <td style="width: 55%; border: none; padding: 0; vertical-align: top;">
            <div style="border-top: 1.5px solid #000; width: 220px; margin-top: 28px; margin-bottom: 4px;"></div>
            <div class="signer-name" style="text-align: left;">{{ $checklist->screener->name }}</div>
            <div class="signer-title" style="text-align: left;">Ethics Secretariat</div>
        </td>
    </tr>
</table>

@include('pdf.partials._footer', ['documentId' => 'ORD-DN'])
</div>
</body>
</html>
