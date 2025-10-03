<?php

$localOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
];

$allowedOrigins = array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', implode(',', $localOrigins))))));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => $allowedOrigins ?: $localOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-Conta-Id',
    ],

    'exposed_headers' => ['Authorization'],

    'max_age' => 0,

    'supports_credentials' => true,
];