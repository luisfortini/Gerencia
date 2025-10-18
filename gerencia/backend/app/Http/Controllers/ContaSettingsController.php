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

    private function metaKey(int $contaId): string
    {
        return "conta:{$contaId}:dashboard_meta_primeira_resposta_min";
    }
}
