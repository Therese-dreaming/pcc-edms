{{--
    Institutional header — the official letterhead image (public/images/DOCS HEADER.png),
    embedded as a base64 data: URI (see _styles.blade.php's comment for why).
    Required: $formNumber (int), $formTitle (string)
--}}
<div class="inst-header">
    <img
        class="inst-header-img"
        src="{{ \App\Shared\Documents\Support\PdfAssets::dataUri('images/DOCS HEADER.png') }}"
        alt="{{ config('pdf.institution_name') }} — {{ config('pdf.department_name') }}"
    >
</div>
<div class="inst-rule"></div>

<div class="form-badge">FORM {{ $formNumber }}</div>
<div class="form-title">{{ $formTitle }}</div>
