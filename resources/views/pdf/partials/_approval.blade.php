{{-- Approval signatory block, reqs/DPO EFORM samples.
     Stakeholder 2026-08-03: EVP signature captured once as PNG, auto-attached.
     Falls back to blank line if the file hasn't been placed yet. --}}
<div class="approval-block">
    <div class="text-bold text-small">Approved by:</div>
    @php
        $sigPath = config('pdf.approval_signature');
        $sigFile = $sigPath ? public_path($sigPath) : null;
    @endphp
    @if ($sigFile && file_exists($sigFile))
        <img
            src="{{ \App\Shared\Documents\Support\PdfAssets::dataUri($sigPath) }}"
            style="height: 42px; margin-bottom: -4px; display: block;"
            alt="{{ config('pdf.approval_signatory') }}"
        >
    @else
        <div class="approval-line"></div>
    @endif
    <div class="approval-name">{{ config('pdf.approval_signatory') }}</div>
    <div class="approval-title">{{ config('pdf.approval_title') }}</div>
</div>
<div class="clearfix"></div>
