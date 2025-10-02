<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessIaJob;
use App\Models\InstanciaWhatsapp;
use App\Models\Lead;
use App\Models\Mensagem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EvolutionWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $token = $request->header('X-Webhook-Token');

        $instancia = InstanciaWhatsapp::where('iwh_webhook_token', $token)->first();

        abort_if(! $instancia, 401, 'Token invÃƒÂ¡lido');

        $payload = $request->validate([
            'mensagem_id' => ['required', 'string'],
            'telefone' => ['required', 'string'],
            'conteudo' => ['required', 'string'],
            'direcao' => ['required', 'string'],
            'nome' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
            'recebido_em' => ['required', 'date']
        ]);

        $lead = Lead::firstOrCreate(
            [
                'led_ctaid' => $instancia->iwh_ctaid,
                'led_telefone' => $payload['telefone']
            ],
            [
                'led_nome' => $payload['nome'] ?? 'WhatsApp Lead',
                'led_email' => $payload['email'] ?? null,
                'led_status' => 'novo',
                'led_etapa' => 'novo',
                'led_status_conf' => 0,
            ]
        );

        $mensagem = Mensagem::firstOrCreate(
            [
                'msg_msgid' => $payload['mensagem_id']
            ],
            [
                'msg_ledid' => $lead->led_id,
                'msg_iwhid' => $instancia->iwh_id,
                'msg_direcao' => $payload['direcao'],
                'msg_conteudo' => $payload['conteudo'],
                'msg_recebido_em' => $payload['recebido_em'],
            ]
        );

        if ($mensagem->wasRecentlyCreated) {
            ProcessIaJob::dispatch($mensagem->msg_id);
        }

        return response()->json(['status' => 'ok']);
    }
}
