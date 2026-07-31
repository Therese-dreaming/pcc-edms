<?php

namespace App\Modules\Dpreq\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Dpreq\Models\ResearchTeamNdaSignatory;
use App\Modules\Dpreq\Services\ResearchTeamNdaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

// stakeholder-additional-features.md (2026-07-25), "Individual Member Electronic Signature
// Workflow" — the public, token-gated signing page reached from a research member's emailed link.
// No login required: the 64-char token is the authorization. The link is single-use (blocked once
// signed) and expiry-checked. Deliberately exposes only the member's own name/role and the study
// title + NDA tracking number — enough to sign in context, no other personal/study data.
class ResearchTeamNdaSigningController extends Controller
{
    public function __construct(private readonly ResearchTeamNdaService $service)
    {
    }

    public function show(string $token): Response
    {
        $signatory = ResearchTeamNdaSignatory::where('signing_token', $token)
            ->with('researchTeamNda.researchApplication')
            ->first();

        if ($signatory === null) {
            return Inertia::render('Nda/Sign', ['state' => 'invalid']);
        }

        $state = match (true) {
            $signatory->hasSigned() => 'used',
            $signatory->isTokenExpired() => 'expired',
            default => 'usable',
        };

        return Inertia::render('Nda/Sign', [
            'token' => $token,
            'state' => $state,
            'member' => [
                'full_name' => $signatory->full_name,
                'role' => $signatory->role,
            ],
            'nda' => [
                'tracking_number' => $signatory->researchTeamNda->tracking_number,
                'research_title' => $signatory->researchTeamNda->researchApplication->research_title,
            ],
            'signedAt' => optional($signatory->signed_at)->toDayDateTimeString(),
        ]);
    }

    public function submit(Request $request, string $token): RedirectResponse
    {
        $validated = $request->validate([
            'typed_full_name' => ['required', 'string', 'max:255'],
            'signature_image' => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:200000'],
            // Form 2 gate — the member must explicitly accept the eight "OBLIGATIONS OF THE
            // RESEARCHER/S" items shown on the signing page before their signature is recorded.
            'obligations_accepted' => ['accepted'],
        ]);

        try {
            $this->service->signByToken($token, $validated['typed_full_name'], $validated['signature_image'] ?? null);
        } catch (RuntimeException $e) {
            return back()->withErrors(['token' => $e->getMessage()]);
        }

        return redirect()->route('nda.sign', $token)->with('success', 'Thank you — your signature has been recorded.');
    }
}
