{{-- Shared PDF styles — docs/reqs formatting. Fonts and the institutional header image are
     embedded as base64 data: URIs (see App\Shared\Documents\Support\PdfAssets) since Browsershot
     renders this HTML via a temp file, not the app's web server — relative /fonts or /images
     URLs would never resolve. This keeps every generated PDF byte-identical regardless of what
     fonts happen to be installed on the host server. --}}
@php
    $aptosRegular = \App\Shared\Documents\Support\PdfAssets::dataUri('fonts/Microsoft Aptos Fonts/Aptos.ttf');
    $aptosBold = \App\Shared\Documents\Support\PdfAssets::dataUri('fonts/Microsoft Aptos Fonts/Aptos-Bold.ttf');
    $timesRegular = \App\Shared\Documents\Support\PdfAssets::dataUri('fonts/times.ttf');
    $courierRegular = \App\Shared\Documents\Support\PdfAssets::dataUri('fonts/cour.ttf');
@endphp
<style>
    @font-face {
        font-family: 'Aptos';
        src: url('{{ $aptosRegular }}') format('truetype');
        font-weight: 400;
        font-style: normal;
    }
    @font-face {
        font-family: 'Aptos';
        src: url('{{ $aptosBold }}') format('truetype');
        font-weight: 700;
        font-style: normal;
    }
    @font-face {
        font-family: 'Times New Roman';
        src: url('{{ $timesRegular }}') format('truetype');
        font-weight: 400;
        font-style: normal;
    }
    @font-face {
        font-family: 'Courier New';
        src: url('{{ $courierRegular }}') format('truetype');
        font-weight: 400;
        font-style: normal;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page { size: letter; margin: 0.4in 0.75in 0.75in 0.75in; }

    body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 8pt;
        color: #000;
        line-height: 1.3;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .content-wrapper { padding-bottom: 50px; }

    .footer {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 100%;
        border-top: 1.5px solid #000;
        padding-top: 6px;
        font-size: 8pt;
        color: #333;
        text-align: right;
        font-family: 'Courier New', monospace;
    }

    .inst-header { text-align: center; margin-bottom: 10px; }
    .inst-header-img { height: 52px; width: auto; }
    .inst-rule { margin: 6px 0 10px; }

    .form-badge {
        font-size: 13pt;
        font-weight: bold;
        text-align: center;
        margin-top: 8px;
        margin-bottom: 4px;
        letter-spacing: 1.5px;
        font-family: 'Aptos', Arial, Helvetica, sans-serif;
        color: #891a1a;
    }

    .form-title {
        font-size: 11pt;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        margin-bottom: 12px;
        font-family: 'Aptos', Arial, Helvetica, sans-serif;
    }

    .question-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2px;
        border: 1px solid #000;
    }
    .question-table td { padding: 3px 6px; vertical-align: top; border: 1px solid #000; }
    .question-table td.label {
        width: 35%;
        font-weight: bold;
        font-family: 'Aptos', Arial, Helvetica, sans-serif;
        font-size: 9pt;
    }
    .question-table td.answer { width: 65%; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8pt; }
    table.bordered { border: 1px solid #000; }
    table.bordered th, table.bordered td {
        border: 1px solid #000;
        padding: 4px 6px;
        text-align: left;
        vertical-align: top;
    }
    table.bordered th {
        background-color: #e0e0e0;
        font-weight: bold;
        text-align: center;
        font-family: 'Aptos', Arial, Helvetica, sans-serif;
        font-size: 9pt;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    table.checklist th.num, table.checklist td.num { width: 35px; text-align: center; font-weight: bold; }
    table.checklist th.response, table.checklist td.response { width: 45px; text-align: center; }

    .response-circle {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 1.5px solid #000;
        border-radius: 50%;
        position: relative;
        vertical-align: middle;
    }
    .response-circle.filled { background-color: #000; }
    .response-circle.filled::after {
        content: '';
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #fff;
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
    }

    table.signature-table { border: 1px solid #000; margin: 6px 0; }
    table.signature-table td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; width: 50%; }
    .signature-label { font-weight: bold; margin-bottom: 2px; font-size: 8pt; font-family: 'Aptos', Arial, Helvetica, sans-serif; }
    .signer-name { font-weight: bold; text-align: center; margin-top: 2px; font-size: 8pt; font-family: 'Aptos', Arial, Helvetica, sans-serif; }
    .signer-title { text-align: center; margin-top: 2px; font-size: 8pt; font-family: 'Aptos', Arial, Helvetica, sans-serif; }

    .certification {
        margin: 6px 0;
        padding: 5px 8px;
        border: 1.5px solid #000;
        background-color: #f9f9f9;
        font-family: 'Times New Roman', Georgia, serif;
        font-style: italic;
        text-align: justify;
        line-height: 1.3;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .certification-checkbox {
        display: inline-block;
        width: 12px; height: 12px;
        border: 1.5px solid #000;
        margin-right: 6px;
        vertical-align: middle;
        position: relative; top: -1px;
    }
    .certification-checkbox.checked { background-color: #000; }
    .certification-checkbox.checked::after {
        content: ''; display: block; width: 6px; height: 6px;
        background-color: #fff; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
    }

    .approval-block { margin-top: 8px; text-align: left; float: left; width: 50%; font-family: 'Aptos', Arial, Helvetica, sans-serif; }
    .approval-line { border-top: 1.5px solid #000; width: 240px; margin: 20px 0 4px 0; }
    .approval-name { font-weight: bold; font-size: 9pt; }
    .approval-title { font-size: 8pt; margin-top: 2px; }

    .section-heading { font-family: 'Aptos', Arial, Helvetica, sans-serif; font-weight: bold; font-size: 10pt; margin: 8px 0 4px; }
    .narrative { font-family: 'Times New Roman', Georgia, serif; font-size: 9pt; text-align: justify; margin-bottom: 6px; line-height: 1.4; }

    .spacer-sm { height: 6px; }
    .spacer-md { height: 12px; }
    .spacer-lg { height: 20px; }
    .text-bold { font-weight: bold; }
    .text-small { font-size: 8pt; }
    .keep-together { page-break-inside: avoid; }
    .clearfix { clear: both; }

    img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
