<?php

return [
    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'verify' => env('OPENAI_VERIFY_SSL', true),
        'timeout' => env('OPENAI_TIMEOUT', 20),
    ],

    'evolution' => [
        'base_url' => env('EVOLUTION_BASE_URL', 'https://evolutionapi.efortini.com.br'),
        'api_key' => env('EVOLUTION_API_KEY'),
        'verify_ssl' => env('EVOLUTION_VERIFY_SSL', true),
    ],
];