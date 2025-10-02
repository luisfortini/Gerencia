<?php

namespace App\Http\Controllers;

use App\Models\InstanciaWhatsapp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstanciaWhatsappController extends Controller
{
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

        abort_if($total >= $limite, 422, 'Limite de instÃƒÂ¢ncias atingido.');

        $data = $request->validate([
            'iwh_nome' => ['required', 'string', 'max:120'],
            'iwh_api_key' => ['required', 'string'],
            'iwh_webhook_token' => ['required', 'string']
        ]);

        $instancia = InstanciaWhatsapp::create([
            'iwh_ctaid' => $conta->cta_id,
            'iwh_nome' => $data['iwh_nome'],
            'iwh_api_key' => $data['iwh_api_key'],
            'iwh_webhook_token' => $data['iwh_webhook_token'],
            'iwh_status' => 'ativo',
        ]);

        return response()->json($instancia, 201);
    }

    public function update(Request $request, InstanciaWhatsapp $instancia): JsonResponse
    {
        $this->authorizeInstancia($request, $instancia);

        $data = $request->validate([
            'iwh_nome' => ['sometimes', 'string', 'max:120'],
            'iwh_status' => ['sometimes', 'string'],
            'iwh_api_key' => ['sometimes', 'string'],
            'iwh_webhook_token' => ['sometimes', 'string'],
        ]);

        $instancia->fill($data);
        $instancia->save();

        return response()->json($instancia);
    }

    public function destroy(Request $request, InstanciaWhatsapp $instancia)
    {
        $this->authorizeInstancia($request, $instancia);

        $instancia->delete();

        return response()->noContent();
    }

    public function testConnection(Request $request, InstanciaWhatsapp $instancia): JsonResponse
    {
        $this->authorizeInstancia($request, $instancia);

        $ok = filled($instancia->iwh_api_key) && filled($instancia->iwh_webhook_token);

        return response()->json([
            'success' => $ok,
            'message' => $ok ? 'Credenciais aparentam vÃƒÂ¡lidas.' : 'Credenciais incompletas.'
        ]);
    }

    protected function authorizeInstancia(Request $request, InstanciaWhatsapp $instancia): void
    {
        $conta = $request->attributes->get('tenant');
        abort_if($instancia->iwh_ctaid !== $conta->cta_id, 403, 'InstÃƒÂ¢ncia nÃƒÂ£o pertence ÃƒÂ  conta.');
    }
}
