<?php

// Pasig Catholic College Institutional Research Ethics Committee (REC) signatories printed on the
// Research Ethics Clearance and Certificate of Exemption (reqs/REMIS-certs/, stakeholder 2026-07-28).
// Kept in config so the names/titles can be updated without touching the certificate templates.
return [
    'chair' => [
        'name' => env('REC_CHAIR_NAME', 'Dr. Perlita R. Antonio'),
        'title' => env('REC_CHAIR_TITLE', 'Chair, Institutional Research Ethics Committee'),
    ],
    'member' => [
        'name' => env('REC_MEMBER_NAME', 'Dr. Antonio L. Cruz'),
        'title' => env('REC_MEMBER_TITLE', 'Member, Institutional Research Ethics Committee/ORD'),
    ],
];
