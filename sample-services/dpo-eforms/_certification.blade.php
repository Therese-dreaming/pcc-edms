@php
/**
 * DPO EFORM certification statement fragment (Forms 1, 2, 5).
 * Now includes a checkbox for user agreement.
 */
$certified = $eform->form_data['certified'] ?? true; // Default checked
@endphp

<div class="certification">
    <span class="certification-checkbox @if($certified) checked @endif"></span>
    I hereby certify that I have read and understood the Data Privacy Policy of Pasig Catholic College, Inc., which pertains to educational research and aligns with the standards of research integrity.
</div>
