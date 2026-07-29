<?php

namespace App\Shared\Documents\Support;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

// docs/3.1 + docs/WORKFLOWS.md promise a scannable QR code on each clearance certificate ("scan a
// certificate's QR code, same lookup"). Until 2026-07-25 the templates only printed the token as
// text, so there was nothing to scan — this renders the real thing.
//
// SVG (not PNG) on purpose: the PDF pipeline is Browsershot/headless Chrome, which renders SVG
// natively at print resolution, and SVG needs no imagick/gd extension — keeping deployment
// dependency-free (docs/7.0's portability requirement). Emitted as a base64 data: URI for the same
// reason PdfAssets does it: Browsershot renders from a temp file, so relative URLs never resolve.
class QrCode
{
    public static function svgDataUri(string $text, int $size = 220): string
    {
        $writer = new Writer(
            new ImageRenderer(new RendererStyle($size, 1), new SvgImageBackEnd())
        );

        return 'data:image/svg+xml;base64,' . base64_encode($writer->writeString($text));
    }
}
