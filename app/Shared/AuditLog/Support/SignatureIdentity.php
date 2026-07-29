<?php

namespace App\Shared\AuditLog\Support;

// stakeholder-additional-features.md (2026-07-25), "Enhanced Electronic Signature Identification"
// — captures the signer's IP address and device (user agent) from the current request, to record
// alongside the name + timestamp already stored with every e-signature. Returns nulls outside an
// HTTP request (e.g. console/seeder signing), which the nullable columns tolerate.
class SignatureIdentity
{
    /**
     * @return array{ip: ?string, user_agent: ?string}
     */
    public static function capture(): array
    {
        $request = request();

        return [
            'ip' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ];
    }
}
