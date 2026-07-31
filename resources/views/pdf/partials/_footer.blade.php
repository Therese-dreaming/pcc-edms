{{-- Required: $documentId (string) --}}
{{-- The footer is emitted as an @page margin box rather than a fixed-position div: Chrome's
     paged-media engine only resolves the page/pages counters inside @page margin boxes, so this
     is the only reliable way to render a repeating "Document ID ... |Page X of Y" footer (the
     official samples carry page numbers). Sitting in the @page bottom-margin band also means
     body content can never collide with it, so no reserved padding is needed in the wrapper. --}}
<style>
@page {
    @bottom-right {
        content: "Document ID: {{ $documentId }}   |Page " counter(page) " of " counter(pages);
        font-family: 'Courier New', monospace;
        font-size: 8pt;
        color: #333;
        border-top: 1.5px solid #000;
        padding-top: 4px;
    }
}
</style>
