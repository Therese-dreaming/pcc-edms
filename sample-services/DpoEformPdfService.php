<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DpoEformType;
use App\Models\DpoEform;
use RuntimeException;
use Spatie\Browsershot\Browsershot;

/**
 * Generates pixel-perfect PDFs for DPO Electronic Forms using Browsershot.
 *
 * Each form renders from a dedicated Blade template under
 * `resources/views/dpo-eforms/`. The templates replicate the official
 * PCC Data Privacy Office form design (header image, form badge,
 * checklists, signature blocks, version control, approval section).
 *
 * Uses Browsershot (Chrome Headless via Puppeteer) for accurate HTML/CSS rendering.
 *
 * @see \App\Services\DpoEformService
 */
class DpoEformPdfService
{
    /**
     * Build HTML content for the given eform.
     *
     * @throws RuntimeException If the form type is unsupported.
     */
    public function buildHtml(DpoEform $eform): string
    {
        $type = $eform->typeEnum();
        $template = $this->resolveTemplate($type);

        return view($template, [
            'eform' => $eform,
            'type'  => $type,
        ])->render();
    }

    /**
     * Build a Browsershot instance configured for PDF generation.
     *
     * @throws RuntimeException If the form type is unsupported.
     */
    public function buildPdf(DpoEform $eform): Browsershot
    {
        $html = $this->buildHtml($eform);
        
        $pdfConfig = config('remis.dpo_eforms.pdf', []);
        
        // Get paper size (letter = 8.5" x 11")
        $paperSize = $pdfConfig['paper_size'] ?? 'letter';
        
        // Convert paper size to dimensions
        $dimensions = $this->getPaperDimensions($paperSize);
        
        $browsershot = Browsershot::html($html)
            ->setOption('args', ['--no-sandbox', '--disable-setuid-sandbox'])
            ->showBackground()
            ->margins(
                $pdfConfig['margin_top'] ?? 19,      // top
                $pdfConfig['margin_right'] ?? 19,    // right
                $pdfConfig['margin_bottom'] ?? 19,   // bottom
                $pdfConfig['margin_left'] ?? 19      // left
            )
            ->format($paperSize)
            ->waitUntilNetworkIdle()
            ->emulateMedia('print');
            
        // Set custom Chrome path if configured (required for Windows)
        $chromePath = config('remis.dpo_eforms.chrome_path');
        if ($chromePath && file_exists($chromePath)) {
            $browsershot->setChromePath($chromePath);
        }
        
        return $browsershot;
    }

    /**
     * Generate and save the PDF to a file path.
     */
    public function save(DpoEform $eform, string $path): void
    {
        $this->buildPdf($eform)->save($path);
    }

    /**
     * Generate and return the PDF as a download response.
     */
    public function download(DpoEform $eform)
    {
        $pdf = $this->buildPdf($eform)->pdf();
        $filename = $this->resolveFileName($eform);
        
        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Generate and return the PDF for inline display (print/preview).
     */
    public function stream(DpoEform $eform)
    {
        $pdf = $this->buildPdf($eform)->pdf();
        $filename = $this->resolveFileName($eform);
        
        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

    /**
     * Resolve the Blade template path for a form type.
     *
     * @throws RuntimeException
     */
    protected function resolveTemplate(DpoEformType $type): string
    {
        return match ($type) {
            DpoEformType::Form1 => 'dpo-eforms.form1',
            DpoEformType::Form2 => 'dpo-eforms.form2',
            DpoEformType::Form3 => 'dpo-eforms.form3',
            DpoEformType::Form5 => 'dpo-eforms.form5',
        };
    }

    /**
     * Build a filesystem-safe file name for the PDF.
     */
    protected function resolveFileName(DpoEform $eform): string
    {
        return $eform->document_id . '.pdf';
    }

    /**
     * Get paper dimensions for common sizes.
     */
    protected function getPaperDimensions(string $size): array
    {
        return match (strtolower($size)) {
            'letter' => ['width' => 8.5, 'height' => 11],
            'a4' => ['width' => 8.27, 'height' => 11.69],
            'legal' => ['width' => 8.5, 'height' => 14],
            default => ['width' => 8.5, 'height' => 11],
        };
    }
}
