@php
/**
 * DPO EFORM approval section fragment (left-aligned per requirements).
 * Renders the signatory block with Dr. Jennifer S. Apolinario.
 */
@endphp

<div class="approval-block">
    <div class="text-bold text-small">Approved by:</div>
    <div class="approval-line"></div>
    <div class="approval-name">{{ config('remis.dpo_eforms.approval_signatory') }}</div>
    <div class="approval-title">{{ config('remis.dpo_eforms.approval_title') }}</div>
</div>
<div style="clear: both;"></div>
