<?php

namespace App\Shared\Documents\Support;

// PdfGenerationService renders these Blade views to an HTML string, then hands that string to
// Browsershot::html() (docs/architecture.md ADR-005), which loads it in headless Chrome via a
// temp file rather than through the app's web server. Relative URLs like `/fonts/...` or
// `/images/...` never resolve in that context. Embedding every font/image as a base64 data: URI
// keeps each PDF template fully self-contained — no network, no file:// path assumptions, works
// identically regardless of host.
class PdfAssets
{
    private const MIME_TYPES = [
        'ttf' => 'font/ttf',
        'otf' => 'font/otf',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
    ];

    public static function dataUri(string $publicRelativePath): string
    {
        $path = public_path($publicRelativePath);
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mime = self::MIME_TYPES[$extension] ?? 'application/octet-stream';

        return 'data:'.$mime.';base64,'.base64_encode(file_get_contents($path));
    }
}
