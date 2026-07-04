{{--
    Institutional header — text-based (no logo asset supplied, see config/pdf.php).
    Required: $formNumber (int), $formTitle (string)
--}}
<div class="inst-header">
    <div class="inst-name">{{ config('pdf.institution_name') }}</div>
    <div class="inst-dept">{{ config('pdf.department_name') }}</div>
</div>
<div class="inst-rule"></div>

<div class="form-badge">FORM {{ $formNumber }}</div>
<div class="form-title">{{ $formTitle }}</div>
