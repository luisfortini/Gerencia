<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf('%s%s', env('APP_URL'), env('SESSION_DOMAIN') ? ','.env('SESSION_DOMAIN') : ''))),

    'guard' => ['web'],

    'expiration' => env('SANCTUM_EXPIRATION', 720),

    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],
];
