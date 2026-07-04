@php
/**
 * Shared PDF styles for DPO EFORMS.
 * Modern CSS with full Chrome/Puppeteer support via Browsershot.
 *
 * Variables expected:
 * @var \App\Models\DpoEform $eform
 * @var \App\Enums\DpoEformType $type
 */
$documentId = $eform->document_id;
$prefixId = $type->documentIdPrefix();
@endphp

<style>
    /* Custom fonts from public/fonts */
    @font-face {
        font-family: 'Aptos';
        src: url('{{ public_path('fonts/Microsoft Aptos Fonts/Aptos.ttf') }}') format('truetype');
        font-weight: normal;
        font-style: normal;
    }
    
    @font-face {
        font-family: 'Aptos';
        src: url('{{ public_path('fonts/Microsoft Aptos Fonts/Aptos-Bold.ttf') }}') format('truetype');
        font-weight: bold;
        font-style: normal;
    }
    
    @font-face {
        font-family: 'Times New Roman';
        src: url('{{ public_path('fonts/times.ttf') }}') format('truetype');
        font-weight: normal;
        font-style: normal;
    }
    
    @font-face {
        font-family: 'Courier New';
        src: url('{{ public_path('fonts/cour.ttf') }}') format('truetype');
        font-weight: normal;
        font-style: normal;
    }

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    @page {
        size: letter;
        margin: 0.4in 0.75in 0.75in 0.75in; /* Smaller top margin for header */
    }

    body {
        font-family: 'Courier New', monospace;
        font-size: 8pt;
        color: #000000;
        line-height: 1.3;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    /* ── Fixed footer at bottom of each page ── */
    @media print {
        .footer {
            position: fixed;
            bottom: 0;
            right: 0;
            border-top: 1.5px solid #000;
            padding-top: 6px;
            font-size: 8pt;
            color: #333;
            background: white;
            text-align: right;
            width: 100%;
            font-family: 'Courier New', monospace;
        }
        
        .content-wrapper {
            padding-bottom: 50px;
        }
    }
    
    .footer {
        text-align: right;
        font-family: 'Courier New', monospace;
        font-size: 8pt;
    }

    /* ── Header ── */
    .inst-header {
        text-align: center;
        margin-bottom: 8px;
        margin-top: 0; /* Lower header position */
    }

    .inst-header img {
        width: 600px; /* Larger header image */
        max-width: 100%;
        height: auto;
    }

    /* Pasig Catholic College text */
    .college-name {
        font-family: 'Times New Roman', serif;
        font-size: 11pt;
        font-weight: normal;
    }

    /* Form badge - Aptos */
    .form-badge {
        font-size: 13pt;
        font-weight: bold;
        text-align: center;
        margin-top: 8px;
        margin-bottom: 4px;
        letter-spacing: 1.5px;
        font-family: 'Aptos', sans-serif;
    }

    /* Form title - Aptos */
    .form-title {
        font-size: 11pt;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        margin-bottom: 12px;
        font-family: 'Aptos', sans-serif;
    }

    /* Content wrapper */
    .content-wrapper {
        margin-bottom: 50px;
    }

    /* ── Two-column layout for questions WITH BORDERS ── */
    .question-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2px;
        font-family: 'Courier New', monospace;
        font-size: 8pt;
        border: 1px solid #000;
    }
    
    .question-table td {
        padding: 3px 6px;
        vertical-align: top;
        border: 1px solid #000;
    }
    
    .question-table td.label {
        width: 35%;
        font-weight: bold;
        font-family: 'Aptos', sans-serif;
        font-size: 9pt;
    }
    
    .question-table td.answer {
        width: 65%;
        font-family: 'Courier New', monospace;
        font-size: 8pt;
    }

    /* ── Data labels and values (Courier New for content) ── */
    .data-label {
        font-weight: bold;
        font-family: 'Aptos', sans-serif;
        font-size: 9pt;
    }

    .data-value {
        font-weight: normal;
        font-family: 'Courier New', monospace;
        font-size: 8pt;
        border-bottom: 1px solid #000;
        display: inline-block;
        min-width: 150px;
        padding: 0 5px 2px 5px;
    }

    .field-row {
        margin-bottom: 4px;
        line-height: 1.4;
    }

    /* ── Checkbox styling (proper circles with CSS) ── */
    .checkbox {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 1.5px solid #000;
        border-radius: 50%;
        margin: 0 4px 0 2px;
        text-align: center;
        line-height: 10px;
        font-size: 8pt;
        vertical-align: middle;
        position: relative;
    }
    
    .checkbox.checked {
        background-color: #000;
    }
    
    .checkbox.checked::after {
        content: '';
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: white;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    
    .checkbox-label {
        margin: 0 8px 0 2px;
        vertical-align: middle;
        font-family: 'Courier New', monospace;
        font-size: 8pt;
    }

    /* ── Tables (Courier New) ── */
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
        font-family: 'Courier New', monospace;
        font-size: 8pt;
    }

    table.bordered {
        border: 1px solid #000;
    }

    table.bordered th,
    table.bordered td {
        border: 1px solid #000;
        padding: 4px 6px;
        text-align: left;
        font-size: 8pt;
        vertical-align: top;
        font-family: 'Courier New', monospace;
    }

    table.bordered th {
        background-color: #e0e0e0;
        font-weight: bold;
        text-align: center;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-family: 'Aptos', sans-serif;
        font-size: 9pt;
    }

    /* ── Checklist table (Courier New) - Circle in cell instead of X ── */
    table.checklist {
        border: 1px solid #000;
    }
    
    table.checklist th {
        background-color: #e0e0e0;
        font-weight: bold;
        text-align: center;
        border: 1px solid #000;
        padding: 4px;
        font-size: 9pt;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-family: 'Aptos', sans-serif;
    }
    
    table.checklist th.num {
        width: 35px;
    }

    table.checklist th.response {
        width: 45px;
    }

    table.checklist td {
        border: 1px solid #000;
        padding: 4px 6px;
        font-size: 8pt;
        font-family: 'Courier New', monospace;
    }
    
    table.checklist td.num {
        text-align: center;
        font-weight: bold;
    }

    table.checklist td.response {
        text-align: center;
        font-size: 8pt;
        font-weight: normal;
    }
    
    /* Circle indicator in response cells */
    .response-circle {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 1.5px solid #000;
        border-radius: 50%;
        position: relative;
        vertical-align: middle;
    }
    
    .response-circle.filled {
        background-color: #000;
    }
    
    .response-circle.filled::after {
        content: '';
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: white;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    /* ── Signature areas IN TABLE - More compact ── */
    table.signature-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 6px;
        margin-bottom: 6px;
        font-family: 'Courier New', monospace;
        border: 1px solid #000;
    }
    
    table.signature-table td {
        border: 1px solid #000;
        padding: 4px 6px;
        vertical-align: top;
        width: 50%;
        font-size: 8pt;
    }
    
    .signature-line {
        border-top: 1.5px solid #000;
        margin-top: 20px;
        padding-top: 3px;
        text-align: center;
    }

    .signer-name {
        font-weight: bold;
        margin-top: 2px;
        text-align: center;
        font-size: 8pt;
        font-family: 'Courier New', monospace;
    }

    .signer-title {
        font-size: 8pt;
        text-align: center;
        margin-top: 2px;
        font-family: 'Courier New', monospace;
    }
    
    .signature-label {
        font-weight: bold;
        margin-bottom: 2px;
        font-size: 8pt;
    }

    /* ── Certification box (Courier New) with checkbox - More compact ── */
    .certification {
        margin: 6px 0;
        padding: 5px 8px;
        border: 1.5px solid #000;
        background-color: #f9f9f9;
        font-style: italic;
        font-size: 8pt;
        text-align: justify;
        line-height: 1.3;
        font-family: 'Courier New', monospace;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .certification-checkbox {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 1.5px solid #000;
        margin-right: 6px;
        vertical-align: middle;
        position: relative;
        top: -1px;
    }
    
    .certification-checkbox.checked {
        background-color: #000;
    }
    
    .certification-checkbox.checked::after {
        content: '';
        display: block;
        width: 6px;
        height: 6px;
        background-color: white;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    /* ── Approval section (LEFT aligned) - Aptos font, more compact ── */
    .approval-block {
        margin-top: 8px;
        text-align: left;
        float: left;
        width: 50%;
        font-family: 'Aptos', sans-serif;
    }

    .approval-line {
        border-top: 1.5px solid #000;
        width: 240px;
        margin: 20px 0 4px 0;
    }

    .approval-name {
        font-weight: bold;
        font-size: 9pt;
        font-family: 'Aptos', sans-serif;
    }

    .approval-title {
        font-size: 8pt;
        margin-top: 2px;
        font-family: 'Aptos', sans-serif;
    }

    /* ── Version control table (Courier New, 8pt) - More compact ── */
    .version-control-block {
        margin-top: 8px;
        margin-bottom: 8px;
        clear: both;
    }
    
    .version-control-block table {
        font-family: 'Courier New', monospace;
        font-size: 8pt;
        margin-bottom: 4px;
    }
    
    .version-control-block th {
        font-family: 'Aptos', sans-serif;
        font-size: 9pt;
        padding: 3px 4px;
    }
    
    .version-control-block td {
        font-size: 8pt;
        padding: 3px 4px;
    }

    /* ── Utility ── */
    .spacer-sm { height: 6px; }
    .spacer-md { height: 12px; }
    .spacer-lg { height: 20px; }

    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-bold { font-weight: bold; }
    .text-small { font-size: 8pt; }
    .text-tiny { font-size: 7pt; }

    .page-break {
        page-break-after: always;
        clear: both;
    }
    
    /* Prevent page breaks inside certain elements */
    .no-page-break {
        page-break-inside: avoid;
    }
    
    .keep-together {
        page-break-inside: avoid;
    }
    
    /* Section headings - Aptos */
    .section-heading {
        font-family: 'Aptos', sans-serif;
        font-weight: bold;
        font-size: 10pt;
        margin-top: 8px;
        margin-bottom: 4px;
    }
    
    /* Narrative text - Aptos for Purpose/Scope content */
    .narrative {
        font-family: 'Aptos', sans-serif;
        font-size: 9pt;
        text-align: justify;
        margin-bottom: 6px;
        line-height: 1.4;
    }
    
    /* Ensure consistent rendering */
    img {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
</style>
