<?php

namespace App\Http\Controllers;

use App\Services\SystemSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContaSettingsController extends Controller
{
    public function __construct(
        private readonly SystemSettingService $settings,
    ) {
    }

    public function showDashboardMeta(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        if (! $conta) {
            abort(403, 'Conta nao encontrada para o usuario autenticado.');
        }

        return response()->json($this->buildPayload((int) $conta->cta_id));
    }

    public function updateDashboardMeta(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        if (! $conta) {
            abort(403, 'Conta nao encontrada para o usuario autenticado.');
        }

        $data = $request->validate([
            'meta_primeira_resposta_min' => ['required', 'integer', 'min:1', 'max:1440'],
        ]);

        $meta = (int) $data['meta_primeira_resposta_min'];

        $this->settings->set($this->metaKey((int) $conta->cta_id), $meta);

        return response()->json($this->buildPayload((int) $conta->cta_id));
    }

    public function showIaContext(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        if (! $conta) {
            abort(403, 'Conta nao encontrada para o usuario autenticado.');
        }

        $this->ensureGestorAccess($request);

        return response()->json($this->buildIaContextPayload((int) $conta->cta_id));
    }

    public function updateIaContext(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        if (! $conta) {
            abort(403, 'Conta nao encontrada para o usuario autenticado.');
        }

        $this->ensureGestorAccess($request);

        $data = $request->validate([
            'empresa_sobre' => ['nullable', 'string', 'max:2000'],
            'empresa_produtos' => ['nullable', 'string', 'max:2000'],
        ]);

        $payload = [
            'empresa_sobre' => $this->normalizeIaContextText($data['empresa_sobre'] ?? null),
            'empresa_produtos' => $this->normalizeIaContextText($data['empresa_produtos'] ?? null),
        ];

        $this->settings->set($this->iaContextKey((int) $conta->cta_id), $payload);

        return response()->json($this->buildIaContextPayload((int) $conta->cta_id));
    }

    private function buildPayload(int $contaId): array
    {
        $default = $this->resolveDefaultMeta();
        $stored = $this->settings->get($this->metaKey($contaId));

        $valor = $this->normalizeMetaValue($stored, $default);

        return [
            'meta_primeira_resposta_min' => $valor,
            'default_meta_primeira_resposta_min' => $default,
        ];
    }

    private function resolveDefaultMeta(): int
    {
        $fallback = 25;
        $stored = $this->settings->get('dashboard_meta_primeira_resposta_min');

        return $this->normalizeMetaValue($stored, $fallback);
    }

    private function normalizeMetaValue(mixed $value, int $fallback): int
    {
        if (is_array($value)) {
            $value = $value['meta_primeira_resposta_min'] ?? null;
        }

        if (is_numeric($value)) {
            $int = (int) $value;

            return max(1, min(1440, $int));
        }

        return $fallback;
    }

    private function buildIaContextPayload(int $contaId): array
    {
        $stored = $this->settings->get($this->iaContextKey($contaId));

        if (! is_array($stored)) {
            $stored = [];
        }

        $empresaSobre = $this->normalizeIaContextText($stored['empresa_sobre'] ?? null);
        $empresaProdutos = $this->normalizeIaContextText($stored['empresa_produtos'] ?? null);

        return [
            'empresa_sobre' => $empresaSobre,
            'empresa_produtos' => $empresaProdutos,
        ];
    }

    private function normalizeIaContextText(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        $trimmed = trim($value);

        return $trimmed === '' ? '' : $trimmed;
    }

    private function metaKey(int $contaId): string
    {
        return "conta:{$contaId}:dashboard_meta_primeira_resposta_min";
    }

    private function iaContextKey(int $contaId): string
    {
        return "conta:{$contaId}:ia_contexto";
    }

    private function ensureGestorAccess(Request $request): void
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Usuario nao autenticado.');
        }

        if (! $user->usr_admin && ! $user->usr_superadmin && $user->usr_papel !== 'gestor') {
            abort(403, 'Somente gestores ou administradores.');
        }
    }
}
