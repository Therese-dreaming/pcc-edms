@php
/**
 * DPO EFORM page footer fragment.
 * Fixed at bottom of page with line separator, right-aligned.
 *
 * Required variables:
 * @var \App\Enums\DpoEformType $type
 * @var int $pageNum (1 or 2)
 */
$prefixId = $type->documentIdPrefix();
@endphp

<div class="footer">
    Document ID: {{ $prefixId }} | Page {{ $pageNum }} of 2
</div>
