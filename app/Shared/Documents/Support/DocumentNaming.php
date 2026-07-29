<?php

namespace App\Shared\Documents\Support;

// stakeholder-additional-features.md, "Automatic File Naming Convention" (2026-07-25) — builds
// the standardized stored filename:
//
//   REC-{MODULE}-{DEPARTMENT}-{CONTROLNO}_{YYYYMMDD}_{FILELABEL}_V{n}.{ext}
//   e.g. REC-REQ-COLLEGE-0235_20260722_APPROVALLETTER_V1.pdf
//
// The original client filename is retained separately in documents.original_filename for
// reference — it is never used as the stored filename.
class DocumentNaming
{
    private const PREFIX = 'REC';

    // Internal module prefix -> the short MODULE token in the spec (NDA / REQ / REMIS).
    private const MODULE_MAP = [
        'DPREQ' => 'REQ',
        'DPNDA' => 'NDA',
        'REMIS' => 'REMIS',
    ];

    public static function filename(
        string $modulePrefix,
        ?string $department,
        string $recordId,
        string $label,
        int $version,
        string $extension,
        ?\DateTimeInterface $date = null,
    ): string {
        return sprintf(
            '%s-%s-%s-%s_%s_%s_V%d.%s',
            self::PREFIX,
            self::module($modulePrefix),
            self::department($department),
            self::controlNumber($recordId),
            ($date ?? now())->format('Ymd'),
            FileLabel::normalize($label),
            $version,
            strtolower($extension),
        );
    }

    public static function module(string $modulePrefix): string
    {
        return self::MODULE_MAP[strtoupper($modulePrefix)] ?? strtoupper($modulePrefix);
    }

    // Normalize a free-text department into the spec's JHS / SHS / COLLEGE / GS buckets, falling
    // back to a cleaned uppercase token (or NA when unknown), so the segment is always present.
    public static function department(?string $raw): string
    {
        $value = strtolower(trim((string) $raw));

        if ($value === '') {
            return 'NA';
        }

        return match (true) {
            str_contains($value, 'college') || str_contains($value, 'tertiary') => 'COLLEGE',
            str_contains($value, 'senior high') || $value === 'shs' || str_contains($value, 'senior-high') => 'SHS',
            str_contains($value, 'junior high') || $value === 'jhs' || str_contains($value, 'junior-high') => 'JHS',
            str_contains($value, 'grade school') || str_contains($value, 'elementary') || $value === 'gs' => 'GS',
            default => strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $value) ?: 'NA'),
        };
    }

    // The CONTROLNO segment: the trailing numeric run of a tracking/control number
    // (DPREQ-2026-0235 -> 0235, DPREQ-2026-000145 -> 000145). Falls back to a cleaned token.
    public static function controlNumber(string $recordId): string
    {
        if (preg_match('/(\d+)\D*$/', $recordId, $m) === 1) {
            return $m[1];
        }

        return strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $recordId) ?: '0');
    }
}
