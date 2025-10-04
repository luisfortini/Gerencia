<?php

namespace App\Http\Controllers;

use App\Models\InstanciaWhatsapp;
use App\Services\Evolution\EvolutionApiService;
use App\Services\SystemSettingService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class InstanciaWhatsappController extends Controller
{
    public function __construct(
        private readonly EvolutionApiService $evolutionApi,
        private readonly SystemSettingService $settings,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        $instancias = InstanciaWhatsapp::query()
            ->where('iwh_ctaid', $conta->cta_id)
            ->get();

        return response()->json($instancias);
    }

    public function store(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        $limite = $conta->cta_limite_instancias;
        $total = InstanciaWhatsapp::query()->where('iwh_ctaid', $conta->cta_id)->count();

        abort_if($total >= $limite, 422, 'Limite de instancias atingido.');

        $data = $request->validate([
            'iwh_nome' => ['required', 'string', 'max:120'],
            'numero' => ['nullable', 'string', 'max:30'],
            'numero_internacional' => ['nullable', 'boolean'],
        ]);

        $apiKey = $this->resolveApiKey();
        $webhookToken = (string) Str::uuid();
        [$normalizedPhone, $rawPhone, $isInternational] = $this->normalizePhone($data['numero'] ?? null, (bool) ($data['numero_internacional'] ?? false));

        try {
            $instancia = DB::transaction(function () use ($conta, $data, $apiKey, $webhookToken, $normalizedPhone, $rawPhone, $isInternational) {
                $instancia = InstanciaWhatsapp::create([
                    'iwh_ctaid' => $conta->cta_id,
                    'iwh_nome' => $data['iwh_nome'],
                    'iwh_api_key' => $apiKey,
                    'iwh_webhook_token' => $webhookToken,
                    'iwh_status' => 'conectando',
                    'iwh_metadata' => $this->withPhoneNumber([], $normalizedPhone, $rawPhone, $isInternational),
                ]);

                $this->evolutionApi->ensureInstance($instancia);

                return $instancia->fresh();
            });
        } catch (RequestException $exception) {
            return $this->evolutionErrorResponse($exception);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Erro ao criar instancia no Evolution API.',
                'details' => $exception->getMessage(),
            ], 500);
        }

        return response()->json($instancia, 201);
    }

    public function update(Request $request, InstanciaWhatsapp $instancia): JsonResponse
    {
        $this->authorizeInstancia($request, $instancia);

        $data = $request->validate([
            'iwh_nome' => ['sometimes', 'string', 'max:120'],
            'iwh_status' => ['sometimes', 'string'],
            'numero' => ['sometimes', 'nullable', 'string', 'max:30'],
            'numero_internacional' => ['sometimes', 'boolean'],
        ]);

        $instancia->fill($data);

        if (array_key_exists('numero', $data) || array_key_exists('numero_internacional', $data)) {
            [$normalizedPhone, $rawPhone, $isInternational] = $this->normalizePhone(
                $data['numero'] ?? ($instancia->iwh_metadata['phone_number_raw'] ?? null),
                (bool) ($data['numero_internacional'] ?? ($instancia->iwh_metadata['phone_number_is_international'] ?? false))
            );

            $instancia->iwh_metadata = $this->withPhoneNumber($instancia->iwh_metadata ?? [], $normalizedPhone, $rawPhone, $isInternational);
        }

        $instancia->save();

        return response()->json($instancia);
    }

    public function destroy(Request $request, InstanciaWhatsapp $instancia)
    {
        $this->authorizeInstancia($request, $instancia);

        try {
            $this->evolutionApi->deleteInstance($instancia);
        } catch (RequestException $exception) {
            if ($exception->response?->status() !== 404) {
                throw $exception;
            }
        }

        $instancia->delete();

        return response()->noContent();
    }

    public function connect(Request $request, InstanciaWhatsapp $instancia): JsonResponse
    {
        $this->authorizeInstancia($request, $instancia);
        $this->ensureInstanciaApiKey($instancia);

        try {
            $payload = $this->evolutionApi->connect($instancia);
        } catch (RequestException $exception) {
            return $this->evolutionErrorResponse($exception);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Erro ao solicitar qrcode no Evolution API.',
                'details' => $exception->getMessage(),
            ], 500);
        }

        $instancia->refresh();

        return response()->json($payload);
    }

    public function syncWebhook(Request $request, InstanciaWhatsapp $instancia): JsonResponse
    {
        $this->authorizeInstancia($request, $instancia);
        $this->ensureInstanciaApiKey($instancia);

        try {
            $payload = $this->evolutionApi->syncWebhook($instancia);
        } catch (RequestException $exception) {
            return $this->evolutionErrorResponse($exception);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Erro ao sincronizar webhook no Evolution API.',
                'details' => $exception->getMessage(),
            ], 500);
        }

        $instancia->refresh();

        return response()->json($payload);
    }

    public function testConnection(Request $request, InstanciaWhatsapp $instancia): JsonResponse
    {
        $this->authorizeInstancia($request, $instancia);
        $this->ensureInstanciaApiKey($instancia);

        try {
            $state = $this->evolutionApi->connectionState($instancia);
        } catch (RequestException $exception) {
            if ($exception->response?->status() === 404) {
                $this->markInstanceAsMissing($instancia);

                return response()->json([
                    'success' => false,
                    'status' => 'desconectado',
                    'message' => 'Instancia nao encontrada na Evolution.',
                ], 410);
            }

            return $this->evolutionErrorResponse($exception);
        }

        $instancia->refresh();

        $status = $instancia->iwh_status;

        return response()->json([
            'success' => strtolower((string) $status) === 'open',
            'status' => $status,
            'instance' => $state['instance'] ?? null,
        ]);
    }

    public function refresh(Request $request, InstanciaWhatsapp $instancia): JsonResponse
    {
        $this->authorizeInstancia($request, $instancia);
        $this->ensureInstanciaApiKey($instancia);

        try {
            $state = $this->evolutionApi->connectionState($instancia);
        } catch (RequestException $exception) {
            if ($exception->response?->status() === 404) {
                $this->markInstanceAsMissing($instancia);

                return response()->json([
                    'success' => false,
                    'status' => 'desconectado',
                    'message' => 'Instancia nao encontrada na Evolution.',
                ], 410);
            }

            return $this->evolutionErrorResponse($exception);
        }

        $instancia->refresh();

        $status = $instancia->iwh_status;

        return response()->json([
            'success' => strtolower((string) $status) === 'open',
            'status' => $status,
            'instance' => $state['instance'] ?? null,
        ]);
    }

    protected function authorizeInstancia(Request $request, InstanciaWhatsapp $instancia): void
    {
        $conta = $request->attributes->get('tenant');
        abort_if($instancia->iwh_ctaid !== $conta->cta_id, 403, 'Instancia nao pertence a conta.');
    }

    protected function evolutionErrorResponse(RequestException $exception): JsonResponse
    {
        $response = $exception->response;
        $status = $response?->status() ?? 502;
        $payload = $response?->json();

        $details = is_array($payload)
            ? ($payload['message'] ?? $payload['error'] ?? $payload)
            : ($payload ?? $exception->getMessage());

        return response()->json([
            'message' => 'Falha ao comunicar com Evolution API.',
            'details' => $details,
        ], $status >= 400 ? $status : 502);
    }

    protected function resolveApiKey(): string
    {
        $apiKey = $this->settings->get('evolution_api_key') ?? config('services.evolution.api_key');

        abort_if(blank($apiKey), 422, 'Configure a API key da Evolution antes de criar instancias.');

        return $apiKey;
    }

    protected function ensureInstanciaApiKey(InstanciaWhatsapp $instancia): void
    {
        $apiKey = $this->resolveApiKey();

        if ($instancia->iwh_api_key !== $apiKey) {
            $instancia->iwh_api_key = $apiKey;
            $instancia->save();
        }
    }

    protected function normalizePhone(?string $numero, bool $international): array
    {
        $raw = $numero ?? '';
        $digits = preg_replace('/\D+/', '', $raw);

        if (blank($digits)) {
            return [null, null, $international];
        }

        if ($international) {
            $normalized = ltrim($digits, '0');

            return [$normalized ?: null, $raw, true];
        }

        $normalized = str_starts_with($digits, '55') ? $digits : '55' . $digits;

        return [$normalized, $raw, false];
    }

    protected function withPhoneNumber(array $metadata, ?string $numero, ?string $original, bool $international): array
    {
        if (blank($numero)) {
            unset($metadata['phone_number'], $metadata['phone_number_raw'], $metadata['phone_number_is_international']);

            return $metadata;
        }

        $metadata['phone_number'] = $numero;
        $metadata['phone_number_raw'] = $original;
        $metadata['phone_number_is_international'] = $international;

        return $metadata;
    }

    protected function markInstanceAsMissing(InstanciaWhatsapp $instancia): void
    {
        $metadata = $instancia->iwh_metadata ?? [];
        $evolution = $metadata['evolution'] ?? [];

        $evolution['status'] = 'desconectado';
        $evolution['missing_at'] = now()->toIso8601String();
        $metadata['evolution'] = $evolution;

        $instancia->iwh_metadata = $metadata;
        $instancia->iwh_status = 'desconectado';
        $instancia->save();
    }
}