<?php

// Document retention schedule. Confirmed with the requester 2026-07-07 (docs/HANDOFF.md Part K
// item 4): 7 years for issued clearances, 3 years for rejected/inactive records — aligned with the
// Philippine Data Privacy Act (RA 10173) and general academic record-retention practice.
//
// Exposed as config (rather than hardcoded) per stakeholder-additional-features.md's "Configurable
// file retention policies" — an institution changing its schedule should not need a code change.
return [

    // Years to retain records whose clearance was issued, counted from the issue date.
    'issued_years' => (int) env('RETENTION_ISSUED_YEARS', 7),

    // Years to retain rejected / disapproved / inactive records, counted from the terminal
    // transition.
    'rejected_years' => (int) env('RETENTION_REJECTED_YEARS', 3),

    // Safety switch for the retention sweep. When false, `edms:apply-retention` reports what is
    // eligible but never deletes, even if --purge is passed. Purging institutional records is
    // irreversible, so it stays opt-in at the environment level as well as per-command.
    'purge_enabled' => (bool) env('RETENTION_PURGE_ENABLED', false),

];
