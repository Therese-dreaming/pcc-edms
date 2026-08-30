<?php

// ClamAV upload scanning (roadmap Phase C, 2026-08-31; research in HANDOFF Part G addendum).
// Deliberately OFF by default (ANTIVIRUS_ENABLED=false) and fail-CLOSED when enabled: if the
// scanner is configured but cannot run (missing binary, daemon down, timeout), uploads are
// rejected rather than waved through — an enabled scanner means the deployment wants the
// guarantee. To run without a scanner, leave it disabled.
return [
    'enabled' => env('ANTIVIRUS_ENABLED', false),

    // Path to the clamscan binary (the ClamAV CLI scanner). On Debian/Ubuntu: apt install clamav.
    // clamscan reloads its signature database per invocation — acceptable for this system's
    // upload volume; switch to clamdscan + a running clamd daemon if volume grows.
    'scanner_binary' => env('ANTIVIRUS_BINARY', 'clamscan'),

    // Per-file scan timeout in seconds.
    'timeout' => (int) env('ANTIVIRUS_TIMEOUT', 60),
];
