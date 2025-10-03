<?php

namespace App\Services\Evolution;

use App\Models\InstanciaWhatsapp;
use App\Services\SystemSettingService;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class EvolutionApiService
{
    public function __construct(
        private readonly SystemSettingService $settings,
    ) {
    }

    public function ensureInstance(InstanciaWhatsapp $instancia): array
    {
        $metadata = $this->getEvolutionMetadata($instancia);

        if (($metadata['instance_name'] ?? null) && ($metadata['token'] ?? null)) {
            return $metadata;
        }

        if (blank($instancia->iwh_api_key)) {
            $apiKey = $this->settings->get('evolution_api_key') ?? config('services.evolution.api_key');

            if (blank($apiKey)) {
                throw new \RuntimeException('Evolution API key is not configured.');
            }

            $instancia->iwh_api_key = $apiKey;
            $instancia->save();
        }

        $instanceName = $this->makeInstanceName($instancia);

        $response = $this->http($instancia->iwh_api_key)
            ->post('/instance/create', [
                'instanceName' => $instanceName,
                'integration' => 'WHATSAPP-BAILEYS',
                'qrcode' => true,
            ])
            ->throw()
            ->json();

        $token = data_get($response, 'hash');

        if (! $token) {
            throw new \RuntimeException('Evolution API did not return an instance token.');
        }

        $this->syncWebhookPayload($instanceName, $token, $instancia);

        $evolutionData = [
            'instance_name' => $instanceName,
            'instance_id' => data_get($response, 'instance.instanceId'),
            'token' => $token,
            'integration' => data_get($response, 'instance.integration', 'WHATSAPP-BAILEYS'),
            'status' => data_get($response, 'instance.status'),
            'last_qr' => data_get($response, 'qrcode'),
        ];

        $this->persistMetadata($instancia, $evolutionData);

        return $evolutionData;
    }

    public function connect(InstanciaWhatsapp $instancia): array
    {
        $metadata = $this->ensureInstance($instancia);

        $response = $this->http($metadata['token'])
            ->get("/instance/connect/{$metadata['instance_name']}")
            ->throw()
            ->json();

        $this->updateConnectionMetadata($instancia, $response);

        return $response;
    }

    public function connectionState(InstanciaWhatsapp $instancia): array
    {
        $metadata = $this->ensureInstance($instancia);

        $response = $this->http($metadata['token'])
            ->get("/instance/connectionState/{$metadata['instance_name']}")
            ->throw()
            ->json();

        $this->updateConnectionMetadata($instancia, $response);

        return $response;
    }

    public function syncWebhook(InstanciaWhatsapp $instancia): array
    {
        $metadata = $this->ensureInstance($instancia);

        return $this->syncWebhookPayload($metadata['instance_name'], $metadata['token'], $instancia);
    }

    public function deleteInstance(InstanciaWhatsapp $instancia): void
    {
        $metadata = $this->getEvolutionMetadata($instancia);
        $instanceName = $metadata['instance_name'] ?? null;

        if (! $instanceName) {
            return;
        }

        $apiKey = $instancia->iwh_api_key ?: ($this->settings->get('evolution_api_key') ?? null);

        if (! $apiKey) {
            return;
        }

        $this->http($apiKey)
            ->delete("/instance/delete/{$instanceName}")
            ->throw();
    }

    protected function syncWebhookPayload(string $instanceName, string $token, InstanciaWhatsapp $instancia): array
    {
        $payload = [
            'webhook' => [
                'enabled' => true,
                'url' => $this->webhookUrl(),
                'headers' => [
                    'X-Webhook-Token' => $instancia->iwh_webhook_token,
                ],
                'byEvents' => false,
                'base64' => false,
                'events' => [
                    'MESSAGES_UPSERT',
                    'MESSAGES_UPDATE',
                    'MESSAGES_SET',
                    'CHATS_UPSERT',
                    'CONNECTION_UPDATE',
                ],
            ],
        ];

        return $this->http($token)
            ->post("/webhook/set/{$instanceName}", $payload)
            ->throw()
            ->json();
    }

    protected function updateConnectionMetadata(InstanciaWhatsapp $instancia, array $response): void
    {
        $metadata = $instancia->iwh_metadata ?? [];
        $evolution = $metadata['evolution'] ?? [];
        $instanceState = $response['instance'] ?? [];

        if (isset($instanceState['state'])) {
            $state = (string) $instanceState['state'];
            $evolution['status'] = $state;
            $instancia->iwh_status = $state;
        } elseif (isset($instanceState['status'])) {
            $status = (string) $instanceState['status'];
            $evolution['status'] = $status;
            $instancia->iwh_status = $status;
        }

        if (isset($response['qrcode'])) {
            $evolution['last_qr'] = $response['qrcode'];
        } elseif (isset($response['base64']) || isset($response['code'])) {
            $evolution['last_qr'] = $response;
        }

        $metadata['evolution'] = $evolution;
        $instancia->iwh_metadata = $metadata;
        $instancia->save();
    }

    protected function getEvolutionMetadata(InstanciaWhatsapp $instancia): array
    {
        return $instancia->iwh_metadata['evolution'] ?? [];
    }

    protected function persistMetadata(InstanciaWhatsapp $instancia, array $evolutionData): void
    {
        $metadata = $instancia->iwh_metadata ?? [];
        $metadata['evolution'] = array_merge($metadata['evolution'] ?? [], $evolutionData);
        $instancia->iwh_metadata = $metadata;
        $instancia->save();
    }

    protected function makeInstanceName(InstanciaWhatsapp $instancia): string
    {
        $slug = Str::slug($instancia->iwh_nome, '-');
        if ($slug === '') {
            $slug = 'instancia';
        }

        return sprintf('%s-cta%s-iwh%s', $slug, $instancia->iwh_ctaid, $instancia->iwh_id);
    }

    protected function webhookUrl(): string
    {
        $base = rtrim(config('app.url'), '/');

        return $base . '/api/webhook/evolution';
    }

    protected function baseUrl(): string
    {
        $stored = $this->settings->get('evolution_base_url');
        $configured = config('services.evolution.base_url');

        $url = $stored ?: $configured;

        return rtrim($url, '/');
    }

    protected function http(string $apiKey): PendingRequest
    {
        return Http::baseUrl($this->baseUrl())
            ->asJson()
            ->acceptJson()
            ->timeout(15)
            ->withOptions(['verify' => $this->verifySsl()])
            ->withHeaders([
                'apikey' => $apiKey,
            ]);
    }

    protected function verifySsl(): bool
    {
        $stored = $this->settings->get('evolution_verify_ssl');

        if ($stored !== null) {
            return filter_var($stored, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true;
        }

        return filter_var(config('services.evolution.verify_ssl', true), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true;
    }
}
