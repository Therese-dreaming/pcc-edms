<?php

namespace App\Shared\Documents\Services;

use Spatie\Browsershot\Browsershot;

// docs/architecture.md ADR-005 + sample-services/DpoEformPdfService.php — renders a Blade view
// to PDF via Browsershot (Chrome headless). Performance notes (per the explicit ask to optimize
// this over the sample-services baseline):
//   - Points at a locally installed Chrome (config/pdf.php) instead of Puppeteer's bundled
//     Chromium, so `npm install` doesn't download ~200MB and there's only one Chrome to keep
//     patched (see docs/7.0-deployment.md's portability requirement — chrome_path is env-driven,
//     never hardcoded).
//   - No `waitUntilNetworkIdle()` — our templates are fully self-contained (system fonts only,
//     no external images/fonts/scripts), so waiting for network idle only adds latency for
//     nothing to wait on.
//   - `--disable-dev-shm-usage` avoids a well-known Chrome-in-constrained-container crash mode;
//     cheap to always set, doesn't cost anything on a normal host.
//   - The real win is at the call site, not in here: every caller of this service should go
//     through a queued job (see Modules\Dpreq\Jobs\GenerateResearchTeamNdaPdfJob for the
//     pattern), so the ~1.5-2s Chrome cold-start per PDF never blocks an HTTP response. This
//     service itself stays synchronous and side-effect-free (render in, bytes out) so it's
//     trivially testable and reusable from a job, a console command, or an on-demand controller
//     action alike.
class PdfGenerationService
{
    public function render(string $view, array $data = []): string
    {
        return view($view, $data)->render();
    }

    public function generate(string $view, array $data = []): string
    {
        return $this->browsershot($this->render($view, $data))->pdf();
    }

    public function save(string $view, array $data, string $path): void
    {
        $this->browsershot($this->render($view, $data))->save($path);
    }

    private function browsershot(string $html): Browsershot
    {
        $shot = Browsershot::html($html)
            ->noSandbox()
            ->setOption('args', ['--disable-dev-shm-usage', '--disable-gpu'])
            ->showBackground()
            ->format(config('pdf.paper_size', 'letter'))
            ->margins(
                config('pdf.margin_top', 19),
                config('pdf.margin_right', 19),
                config('pdf.margin_bottom', 19),
                config('pdf.margin_left', 19),
            )
            ->emulateMedia('print');

        if ($chromePath = config('pdf.chrome_path')) {
            $shot->setChromePath($chromePath);
        }

        if ($nodeModulePath = config('pdf.node_module_path')) {
            $shot->setNodeModulePath($nodeModulePath);
        }

        return $shot;
    }
}
