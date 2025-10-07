<?php

namespace App\Services\Ia;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiIaProvider implements IaProviderContract
{
    private const STATUSES = [
        'novo',
        'qualificado',
        'interessado',
        'negociacao',
        'follow_up',
        'ganho',
        'perdido',
    ];

    public function __construct(private readonly ?string $apiKey)
    {
    }

    public function analyze(array $payload): IaResponse
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException('OPENAI_API_KEY nao configurada');
        }

        $messages = [
            [
                'role' => 'system',
                'content' => 'Voce eh um analista comercial senior. Classifique o lead nos status permitidos (novo, qualificado, interessado, negociacao, follow_up, ganho, perdido). Considere historico, direcao das mensagens e conteudo recente. Sempre responda apenas JSON valido contendo status, status_conf (entre 0.70 e 1.0), valor_total (numero ou null), objecao (string ou null) e um objeto detalhes com observacoes relevantes, incluindo ultima_mensagem e historico_mensagens quando fizer sentido. Voce pode retroceder o status (por exemplo, de follow_up para interessado) quando os sinais forem de perda de interesse. Quando retroceder, adicione em detalhes.motivo_retrocesso uma breve explicacao. Prefira status_conf >= 0.75 quando houver indicios claros e nunca retorne status_conf igual a 0.'
            ],
            [
                'role' => 'user',
                'content' => json_encode($payload, JSON_UNESCAPED_UNICODE)
            ],
        ];

        $verify = config('services.openai.verify', true);
        if (is_string($verify)) {
            $parsed = filter_var($verify, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            $verify = $parsed === null ? true : $parsed;
        }

        $timeout = (float) config('services.openai.timeout', 20);

        $response = Http::withToken($this->apiKey)
            ->withOptions([
                'verify' => $verify,
            ])
            ->timeout($timeout > 0 ? $timeout : 20)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'temperature' => 0.2,
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
                                'detalhes' => ['type' => 'object'],
                            ],
                            'required' => ['status', 'status_conf'],
                        ],
                    ],
                ],
            ])
            ->throw();

        $content = Arr::get($response->json(), 'choices.0.message.content');

        if (! $content) {
            throw new RuntimeException('Resposta invalida do provedor IA');
        }

        $decoded = json_decode($content, true);

        if (! is_array($decoded)) {
            throw new RuntimeException('Conteudo IA invalido');
        }

        if (! isset($decoded['detalhes']) || ! is_array($decoded['detalhes'])) {
            $decoded['detalhes'] = [];
        }

        $status = isset($decoded['status']) ? strtolower((string) $decoded['status']) : 'novo';
        if (! in_array($status, self::STATUSES, true)) {
            $status = 'interessado';
        }
        $decoded['status'] = $status;

        $statusConf = isset($decoded['status_conf']) && is_numeric($decoded['status_conf'])
            ? (float) $decoded['status_conf']
            : 0.0;

        if ($statusConf > 1) {
            $statusConf = $statusConf > 100 ? $statusConf / 100 : min(1, $statusConf);
        }

        if ($statusConf < 0.01) {
            $statusConf = 0.75;
        }

        $decoded['status_conf'] = max(0.0, min(1.0, $statusConf));

        $decoded['detalhes']['provider'] = $decoded['detalhes']['provider'] ?? 'openai';

        if (! array_key_exists('valor_total', $decoded)) {
            $decoded['valor_total'] = null;
        }

        return IaResponse::fromArray($decoded);
    }
}