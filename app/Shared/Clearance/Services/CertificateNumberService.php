<?php

namespace App\Shared\Clearance\Services;

use App\Shared\Clearance\Models\ClearanceCertificate;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

// stakeholder-additional-features.md, "Certificate Control Number" (2026-07-25) — every issued
// certificate carries a unique control number: auto-generated, never reused, searchable, printed
// on the certificate, and used for authenticity verification. Format:
//   DPREQ-{YYYY}-{NNNNNN}   e.g. DPREQ-2026-000145
//   REMIS-{YYYY}-{NNNNNN}   e.g. REMIS-2026-000098
//
// The number is distinct from an application's tracking_number (DPREQ-2026-0001 / REC-2026-0001,
// 4-digit, on the application record) — the requester confirmed the two coexist: tracking number
// stays an internal working ID, control number is the certificate's authenticity ID.
//
// "Never reused" is enforced by deriving the next sequence from the MAX existing suffix (not a
// COUNT), so a deleted/gapped record can never hand the same number out twice. The read+write is
// wrapped in a locked transaction to keep two concurrent issuances from colliding.
class CertificateNumberService
{
    private const PREFIXES = ['DPREQ', 'REMIS'];

    /**
     * @param  'DPREQ'|'REMIS'  $prefix
     */
    public function next(string $prefix): string
    {
        if (! in_array($prefix, self::PREFIXES, true)) {
            throw new InvalidArgumentException("Unknown certificate prefix: {$prefix}.");
        }

        $column = $prefix === 'DPREQ' ? 'dpreq_certificate_number' : 'remis_certificate_number';
        $year = now()->year;
        $like = "{$prefix}-{$year}-%";

        return DB::transaction(function () use ($column, $prefix, $year, $like) {
            $latest = ClearanceCertificate::query()
                ->where($column, 'like', $like)
                ->lockForUpdate()
                ->orderByDesc($column)
                ->value($column);

            $lastSequence = $latest ? (int) substr($latest, strrpos($latest, '-') + 1) : 0;

            return sprintf('%s-%d-%06d', $prefix, $year, $lastSequence + 1);
        });
    }
}
