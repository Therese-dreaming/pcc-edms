<?php

namespace App\Shared\Auth\Concerns;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

// C2 (concern 10) — a reusable server-side check that the acting staff member re-entered their OWN
// password before a consequential action (DPREQ reject, REMIS disapprove / endorsement-reject).
// The password arrives in the request (posted by the confirmWithPassword() SweetAlert helper) and
// is verified with Hash::check against the authenticated user's stored hash. A wrong/missing
// password throws a 422 ValidationException on the `password` key, so no state change occurs.
trait ConfirmsPassword
{
    protected function confirmPassword(Request $request, string $field = 'password'): void
    {
        $password = (string) $request->input($field, '');

        if ($password === '' || !Hash::check($password, $request->user()->password)) {
            throw ValidationException::withMessages([
                $field => 'The password you entered is incorrect.',
            ]);
        }
    }
}
