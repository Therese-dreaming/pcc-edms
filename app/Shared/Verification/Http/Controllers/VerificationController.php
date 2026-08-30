<?php

namespace App\Shared\Verification\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Clearance\Models\ClearanceCertificate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// docs/3.1-remis-application-form.md, docs/1.1-dpreq-application-form.md — the public,
// unauthenticated Verification Portal, checkable "by number or QR scan" (docs/3.1).
//
// As of stakeholder-additional-features.md (2026-07-25) the DPO and Ethics clearances are
// issued INDEPENDENTLY, each with its own control number and QR token. A single lookup value
// therefore identifies exactly one track — this returns that track's own validity, not a joint
// result. The DPO and Ethics certificates of the same study may have different issue/expiry
// dates, or one may exist while the other doesn't yet.
//
// docs/testing-strategy.md: this is the one endpoint with no auth to fall back on, so it must
// fail closed (identical generic response for "malformed" and "not found" — never let the
// response shape itself become an oracle for enumerating valid tokens) and expose no personal
// data beyond clearance validity/status.
class VerificationController extends Controller
{
    public function show(Request $request, ?string $token = null): Response
    {
        $lookup = $token ?? $request->query('q');

        if ($lookup === null || $lookup === '') {
            return Inertia::render('Verify', ['result' => null, 'searched' => $lookup !== null]);
        }

        // DPO track — issued when dpreq_issued_at is set.
        $dpo = ClearanceCertificate::whereNotNull('dpreq_issued_at')
            ->where(fn ($q) => $q->where('dpreq_qr_token', $lookup)->orWhere('dpreq_certificate_number', $lookup))
            ->first();

        if ($dpo) {
            return $this->result('DPO', 'Data Privacy Clearance', $dpo->dpreq_certificate_number, $dpo->dpreq_issued_at, $dpo->dpreq_valid_until);
        }

        // Ethics track — issued when remis_issued_at is set.
        $ethics = ClearanceCertificate::whereNotNull('remis_issued_at')
            ->where(fn ($q) => $q->where('remis_qr_token', $lookup)->orWhere('remis_certificate_number', $lookup))
            ->first();

        if ($ethics) {
            $label = $ethics->isRemisExemption()
                ? 'Certificate of Exemption from Research Ethics Clearance'
                : 'Research Ethics Clearance';

            return $this->result('ETHICS', $label, $ethics->remis_certificate_number, $ethics->remis_issued_at, $ethics->remis_valid_until);
        }

        return Inertia::render('Verify', ['result' => null, 'searched' => true]);
    }

    private function result(string $track, string $label, string $controlNumber, $issuedAt, $validUntil): Response
    {
        $isValid = $validUntil === null || now()->lte($validUntil);

        return Inertia::render('Verify', [
            'searched' => true,
            'result' => [
                'valid' => $isValid,
                'track' => $track,
                'track_label' => $label,
                'control_number' => $controlNumber,
                'issued_at' => $issuedAt->toDateString(),
                'valid_until' => optional($validUntil)->toDateString(),
            ],
        ]);
    }
}
