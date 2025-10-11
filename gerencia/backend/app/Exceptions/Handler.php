<?php

namespace App\\Exceptions;

use Illuminate\\Auth\\AuthenticationException;
use Illuminate\\Foundation\\Exceptions\\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    protected  = [
        //
    ];

    protected  = [
        //
    ];

    protected  = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        ->reportable(function (Throwable ) {
            //
        });
    }

    protected function unauthenticated(, AuthenticationException )
    {
        return response()->json([
            'message' => 'Unauthenticated.'
        ], 401);
    }
}
