<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Conta;
use App\Models\InstanciaWhatsapp;
use App\Models\Lead;
use App\Models\LogStatusLead;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SuperAdminController extends Controller
{
    public function overview(): JsonResponse
    {
        return response()->json([
            'contas' => Conta::count(),
            'usuarios' => Usuario::count(),
            'instancias' => InstanciaWhatsapp::count(),
            'leads' => Lead::count()
        ]);
    }

    public function contas(): JsonResponse
    {
        $contas = Conta::withCount(['instanciasWhatsapp', 'usuarios', 'leads'])->get();

        return response()->json($contas);
    }

    public function storeConta(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cta_nome' => ['required', 'string', 'max:150'],
            'cta_slug' => ['required', 'string', 'max:150', 'unique:conta,cta_slug'],
            'cta_limite_instancias' => ['required', 'integer', 'min:1'],
            'cta_retencao_dias' => ['required', 'integer', 'min:1'],
            'cta_plano_tipo' => ['required', Rule::in(['mensal', 'anual'])]
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
            'usr_papel' => ['required', Rule::in(['gestor', 'operador'])]
        ]);

        $usuario = Usuario::create([
            'usr_ctaid' => $conta->cta_id,
            'usr_nome' => $data['usr_nome'],
            'usr_email' => $data['usr_email'],
            'usr_senha' => Hash::make($data['usr_senha']),
            'usr_papel' => $data['usr_papel'],
            'usr_superadmin' => false,
            'usr_ativo' => true,
        ]);

        return response()->json($usuario, 201);
    }

    public function atualizarRetencao(Request $request, Conta $conta): JsonResponse
    {
        $data = $request->validate([
            'cta_retencao_dias' => ['required', 'integer', 'min:1']
        ]);

        $conta->cta_retencao_dias = $data['cta_retencao_dias'];
        $conta->save();

        return response()->json($conta);
    }

    public function logs(Request $request, Conta $conta): JsonResponse
    {
        $logs = LogStatusLead::query()
            ->whereHas('lead', fn ($q) => $q->where('led_ctaid', $conta->cta_id))
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }
}
