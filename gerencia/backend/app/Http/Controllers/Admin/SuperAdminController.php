<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Conta;
use App\Models\InstanciaWhatsapp;
use App\Models\Lead;
use App\Models\LogStatusLead;
use App\Models\Usuario;
use App\Services\SystemSettingService;
use App\Services\UsuarioLimitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SuperAdminController extends Controller
{
    public function __construct(
        private readonly SystemSettingService $settings,
        private readonly UsuarioLimitService $usuarioLimit,
    ) {
    }

    public function overview(): JsonResponse
    {
        return response()->json([
            'contas' => Conta::count(),
            'usuarios' => Usuario::count(),
            'instancias' => InstanciaWhatsapp::count(),
            'leads' => Lead::count(),
        ]);
    }

    public function contas(): JsonResponse
    {
        $contas = Conta::withCount(['instanciasWhatsapp', 'usuarios', 'leads'])->get();

        return response()->json($contas);
    }

    public function updateConta(Request $request, Conta $conta): JsonResponse
    {
        $data = $request->validate([
            'cta_nome' => ['sometimes', 'string', 'max:150'],
            'cta_slug' => ['sometimes', 'string', 'max:150', Rule::unique('conta', 'cta_slug')->ignore($conta->cta_id, 'cta_id')],
            'cta_limite_instancias' => ['sometimes', 'integer', 'min:1'],
            'cta_limite_usuarios' => ['sometimes', 'integer', 'min:1'],
            'cta_retencao_dias' => ['sometimes', 'integer', 'min:1'],
            'cta_plano_tipo' => ['sometimes', Rule::in(['mensal', 'anual'])],
            'cta_status' => ['sometimes', 'string', Rule::in(['ativo', 'inativo'])],
            'cta_observacoes' => ['sometimes', 'nullable', 'string'],
        ]);

        $conta->fill($data);
        $conta->save();

        return response()->json($conta);
    }

    public function deleteConta(Conta $conta)
    {
        $conta->delete();

        return response()->noContent();
    }

    public function storeConta(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cta_nome' => ['required', 'string', 'max:150'],
            'cta_slug' => ['required', 'string', 'max:150', 'unique:conta,cta_slug'],
            'cta_limite_instancias' => ['required', 'integer', 'min:1'],
            'cta_limite_usuarios' => ['required', 'integer', 'min:1'],
            'cta_retencao_dias' => ['required', 'integer', 'min:1'],
            'cta_plano_tipo' => ['required', Rule::in(['mensal', 'anual'])],
        ]);

        $conta = Conta::create(array_merge($data, [
            'cta_status' => 'ativo',
        ]));

        return response()->json($conta, 201);
    }

    public function criarUsuario(Request $request, Conta $conta): JsonResponse
    {
        $data = $request->validate([
            'usr_nome' => ['required', 'string', 'max:150'],
            'usr_email' => ['required', 'email', 'unique:usuario,usr_email'],
            'usr_senha' => ['required', 'string', 'min:6'],
            'usr_papel' => ['required', Rule::in(['gestor', 'operador'])],
            'usr_admin' => ['sometimes', 'boolean'],
        ]);

        $this->usuarioLimit->assertCanAddActiveUsers($conta);

        $usuario = Usuario::create([
            'usr_ctaid' => $conta->cta_id,
            'usr_nome' => $data['usr_nome'],
            'usr_email' => $data['usr_email'],
            'usr_senha' => Hash::make($data['usr_senha']),
            'usr_papel' => $data['usr_papel'],
            'usr_superadmin' => false,
            'usr_admin' => (bool) ($data['usr_admin'] ?? false),
            'usr_ativo' => true,
        ]);

        return response()->json($usuario, 201);
    }

    public function atualizarRetencao(Request $request, Conta $conta): JsonResponse
    {
        $data = $request->validate([
            'cta_retencao_dias' => ['required', 'integer', 'min:1'],
        ]);

        $conta->cta_retencao_dias = $data['cta_retencao_dias'];
        $conta->save();

        return response()->json($conta);
    }

    public function logs(Request $request, Conta $conta): JsonResponse
    {
        $logs = LogStatusLead::query()
            ->whereHas('lead', fn ($query) => $query->where('led_ctaid', $conta->cta_id))
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }

    public function evolutionConfig(): JsonResponse
    {
        return response()->json($this->buildEvolutionSettingsPayload());
    }

    public function updateEvolutionConfig(Request $request): JsonResponse
    {
        $data = $request->validate([
            'base_url' => ['sometimes', 'url'],
            'api_key' => ['sometimes', 'nullable', 'string'],
            'verify_ssl' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('base_url', $data)) {
            $normalized = rtrim($data['base_url'], '/');
            $this->settings->set('evolution_base_url', $normalized);
        }

        if (array_key_exists('api_key', $data)) {
            $apiKey = $data['api_key'];
            if ($apiKey === null || $apiKey === '') {
                $this->settings->forget('evolution_api_key');
            } else {
                $this->settings->set('evolution_api_key', $apiKey);
            }
        }

        if (array_key_exists('verify_ssl', $data)) {
            $this->settings->set('evolution_verify_ssl', $data['verify_ssl']);
        }

        return response()->json($this->buildEvolutionSettingsPayload());
    }

    protected function buildEvolutionSettingsPayload(): array
    {
        $baseUrl = $this->settings->get('evolution_base_url') ?? config('services.evolution.base_url');
        $apiKey = $this->settings->get('evolution_api_key') ?? config('services.evolution.api_key');
        $verifyStored = $this->settings->get('evolution_verify_ssl');
        $verify = $verifyStored !== null
            ? (filter_var($verifyStored, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true)
            : (filter_var(config('services.evolution.verify_ssl', true), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true);

        return [
            'base_url' => rtrim($baseUrl ?? '', '/'),
            'default_base_url' => config('services.evolution.base_url'),
            'api_key' => $apiKey,
            'verify_ssl' => (bool) $verify,
            'default_verify_ssl' => (bool) (filter_var(config('services.evolution.verify_ssl', true), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true),
        ];
    }
}

