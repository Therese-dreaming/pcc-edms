<?php

namespace App\Shared\Verification\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Clearance\Models\ClearanceCertificate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// docs/3.1-remis-application-form.md, docs/1.1-dpreq-application-form.md — the public,
// unauthenticated Verification Portal, checkable "by number or QR scan" (docs/3.1). Both paths
// resolve through the same lookup so the response shape is identical either way.
// docs/testing-strategy.md: this is the one endpoint with no auth to fall back on, so it must
// fail closed (identical generic response for "malformed" and "not found" — never let the
// response shape itself become an oracle for enumerating valid tokens) and expose no personal
// data beyond clearance validity/status.
class VerificationController extends Controller
{
    public function show(Request $request, ?string $token = null): Response
    {
        $lookup = $token ?? $request->query('q');

        $certificate = $lookup
            ? ClearanceCertificate::whereNotNull('issued_at')
                ->where(function ($q) use ($lookup) {
                    $q->where('qr_token', $lookup)
                        ->orWhere('dpreq_certificate_number', $lookup)
                        ->orWhere('remis_certificate_number', $lookup);
                })
                ->with('researchApplication')
                ->first()
            : null;

        if (! $certificate) {
            return Inertia::render('Verify', ['result' => null, 'searched' => $lookup !== null]);
        }

        $isValid = $certificate->valid_until === null || now()->lte($certificate->valid_until);

        return Inertia::render('Verify', [
            'searched' => true,
            'result' => [
                'valid' => $isValid,
                'dpreq_certificate_number' => $certificate->dpreq_certificate_number,
                'remis_certificate_number' => $certificate->remis_certificate_number,
                'issued_at' => $certificate->issued_at->toDateString(),
                'valid_until' => optional($certificate->valid_until)->toDateString(),
            ],
        ]);
    }
}
