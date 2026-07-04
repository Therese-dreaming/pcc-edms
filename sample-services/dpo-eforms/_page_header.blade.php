@php
/**
 * DPO EFORM page header fragment.
 * Larger header, form title/badge only on page 1.
 *
 * Required variables:
 * @var \App\Enums\DpoEformType $type
 * @var int $pageNum    (1 or 2)
 * @var bool $showBadge (default true — show form badge + title, only on page 1)
 */
$prefixId = $type->documentIdPrefix();
$showBadge = $showBadge ?? ($pageNum === 1);
@endphp

<div class="inst-header">
    <img src="{{ config('remis.dpo_eforms.pdf_header_image') }}" alt="Pasig Catholic College, Inc." />
</div>

@if($showBadge && $pageNum === 1)
    <div class="form-badge">FORM {{ $type->number() }}</div>
    <div class="form-title">
        @switch($type)
            @case(\App\Enums\DpoEformType::Form1) ONLINE APPLICATION FOR DATA PRIVACY AND ETHICS REVIEW @break
            @case(\App\Enums\DpoEformType::Form2) NON-DISCLOSURE AGREEMENT @break
            @case(\App\Enums\DpoEformType::Form3) DATA PRIVACY AND RESEARCH ETHICS CLEARANCE @break
            @case(\App\Enums\DpoEformType::Form5) THE NON-DISCLOSURE AGREEMENT FOR ON-THE-JOB TRAINEE @break
        @endswitch
    </div>
@endif
