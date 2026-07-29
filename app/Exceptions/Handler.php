<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontReport = [
        //
    ];

    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        // docs/testing-strategy.md — verification portal returns generic response for
        // rate-limited requests to prevent enumeration attacks.
        $this->render(function (HttpException $e, $request) {
            if ($e->getStatusCode() === 429) {
                // For verification endpoints, return a generic response
                if (str_starts_with($request->path(), 'verify')) {
                    return response()->inertia(
                        'Verify',
                        ['result' => null, 'searched' => false, 'message' => 'Too many requests. Please try again later.'],
                        429
                    );
                }
            }
        });
    }
}