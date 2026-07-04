@php
/**
 * Annual Ethics Report — docs/5.2-reports-ord.md
 *
 * @var array $data
 */
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Annual Ethics Report {{ $data['year'] }}</title>
    @include('pdf.partials._styles')
</head>
<body>
<div class="content-wrapper">

@include('pdf.partials._header', ['formNumber' => '', 'formTitle' => 'Annual Ethics Report — ' . $data['year']])

<div class="section-heading">Summary</div>
<table class="bordered">
    <tr><th>Metric</th><th>Count</th></tr>
    <tr><td>Total Applications Submitted</td><td>{{ $data['total_submitted'] }}</td></tr>
    <tr><td>Total Approved</td><td>{{ $data['total_approved'] }}</td></tr>
    <tr><td>Total Deferred</td><td>{{ $data['total_deferred'] }}</td></tr>
    <tr><td>Total Disapproved</td><td>{{ $data['total_disapproved'] }}</td></tr>
    <tr><td>Archived Studies</td><td>{{ $data['archived_count'] }}</td></tr>
</table>

<div class="section-heading">By Risk Level</div>
<table class="bordered">
    <tr><th>Risk Level</th><th>Count</th></tr>
    @forelse ($data['by_risk_level'] as $level => $count)
        <tr><td>{{ ucfirst($level) }}</td><td>{{ $count }}</td></tr>
    @empty
        <tr><td colspan="2">No classifications recorded for {{ $data['year'] }}.</td></tr>
    @endforelse
</table>

<div class="section-heading">By Department</div>
<table class="bordered">
    <tr><th>Department</th><th>Count</th></tr>
    @forelse ($data['by_department'] as $department => $count)
        <tr><td>{{ $department }}</td><td>{{ $count }}</td></tr>
    @empty
        <tr><td colspan="2">No applications submitted for {{ $data['year'] }}.</td></tr>
    @endforelse
</table>

<div class="section-heading">By Study Type</div>
<table class="bordered">
    <tr><th>Study Type</th><th>Count</th></tr>
    @forelse ($data['by_study_type'] as $type => $count)
        <tr><td>{{ ucwords(str_replace('_', ' ', $type)) }}</td><td>{{ $count }}</td></tr>
    @empty
        <tr><td colspan="2">No applications submitted for {{ $data['year'] }}.</td></tr>
    @endforelse
</table>

<div class="section-heading">Monitoring Compliance Summary</div>
<table class="bordered">
    <tr><th>Compliance Status</th><th>Count</th></tr>
    @forelse ($data['compliance_summary'] as $status => $count)
        <tr><td>{{ ucwords(str_replace('_', ' ', $status)) }}</td><td>{{ $count }}</td></tr>
    @empty
        <tr><td colspan="2">No progress reports reviewed for {{ $data['year'] }}.</td></tr>
    @endforelse
</table>

</div>
@include('pdf.partials._footer', ['documentId' => 'RPT-ANNUAL-ETHICS-' . $data['year']])
</body>
</html>
