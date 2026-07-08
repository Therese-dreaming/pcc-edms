<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Browsershot / Chrome configuration
    |--------------------------------------------------------------------------
    |
    | docs/architecture.md ADR-005 + sample-services/DpoEformPdfService.php.
    | Points Browsershot at a locally installed Chrome/Chromium binary instead
    | of downloading Puppeteer's bundled Chromium — faster install, one fewer
    | thing to keep updated, and the only realistic option for env-agnostic
    | deployment per docs/7.0-deployment.md (server-installed Chrome varies by
    | host, so this stays entirely env-driven).
    |
    */
    'chrome_path' => env('PDF_CHROME_PATH'),
    'node_module_path' => env('PDF_NODE_MODULE_PATH'),

    /*
    |--------------------------------------------------------------------------
    | Paper / margins
    |--------------------------------------------------------------------------
    */
    'paper_size' => 'letter',
    'margin_top' => 19,
    'margin_right' => 19,
    'margin_bottom' => 19,
    'margin_left' => 19,

    /*
    |--------------------------------------------------------------------------
    | Institutional header (reqs/DPO EFORM samples)
    |--------------------------------------------------------------------------
    |
    | Rendered as the official letterhead image, public/images/DOCS HEADER.png
    | (added 2026-07-06), via pdf/partials/_header.blade.php. `institution_name`
    | stays in config since resources/views/mail/notification.blade.php also
    | reads it; `department_name` is now only used as the header image's alt
    | text (the image already renders both lines visually).
    |
    */
    'institution_name' => 'Pasig Catholic College, Inc.',
    'department_name' => 'Information Systems Security Department',

    /*
    |--------------------------------------------------------------------------
    | Signatories (docs/0.4, reqs/DPO EFORM 1 & 3 SAMPLE.pdf)
    |--------------------------------------------------------------------------
    |
    | ASSUMPTION placeholders pending real DPO/EVP confirmation — see
    | docs/9.1-review-and-open-questions.md.
    |
    */
    'approval_signatory' => 'Dr. Jennifer S. Apolinario',
    'approval_title' => 'Executive Vice President',
    'dpo_officer' => 'Dr. Virgilio V. Vivo',
    'research_ethics_head' => 'Dr. Antonio Cruz',

];
