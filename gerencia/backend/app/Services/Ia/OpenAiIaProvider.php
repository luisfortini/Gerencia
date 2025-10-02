<?php

namespace App\Services\Ia;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class OpenAiIaProvider implements IaProviderContract
{
    public function __construct(private readonly ?string $apiKey)
    {
    }

    public function analyze(array $payload): IaResponse
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException('OPENAI_API_KEY nÃƒÂ£o configurada');
        }

        $messages = [
            [
                'role' => 'system',
                'content' => 'VocÃƒÂª ÃƒÂ© um analista comercial que retorna JSON com status, status_conf, valor_total, objecao.'
            ],
            [
                'role' => 'user',
                'content' => json_encode($payload)
            ]
        ];

        $response = Http::withToken($this->apiKey)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'messages' => $messages,
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'lead_analysis',
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'status' => ['type' => 'string'],
                                'status_conf' => ['type' => 'number'],
                                'valor_total' => ['type' => ['number', 'null']],
                                'objecao' => ['type' => ['string', 'null']],
                                'detalhes' => ['type' => 'object']
                            ],
                            'required' => ['status', 'status_conf']
                        ]
                    ]
                ]
            ])->throw();

        $content = Arr::get($response->json(), 'choices.0.message.content');

        if (! $content) {
            throw new RuntimeException('Resposta invÃƒÂ¡lida do provedor IA');
        }

        $decoded = json_decode($content, true);

        if (! is_array($decoded)) {
            throw new RuntimeException('ConteÃƒÂºdo IA invÃƒÂ¡lido');
        }

        return IaResponse::fromArray($decoded);
    }
}
