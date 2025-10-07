<?php

namespace App\Jobs;

use App\Models\AuditoriaIa;
use App\Models\Mensagem;
use App\Services\Ia\IaResponse;
use App\Services\Ia\IaServiceFactory;
use App\Services\LeadStatusService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessIaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $mensagemId)
    {
    }

    public function handle(IaServiceFactory $factory, LeadStatusService $statusService): void
    {
        $mensagem = Mensagem::with('lead')->find($this->mensagemId);

        if (! $mensagem || ! $mensagem->lead) {
            return;
        }

        $lead = $mensagem->lead;

        $historico = $lead->mensagens()
            ->whereNotNull('msg_conteudo')
            ->orderByDesc('msg_recebido_em')
            ->limit(10)
            ->get(['msg_id', 'msg_conteudo', 'msg_direcao', 'msg_recebido_em'])
            ->sortBy('msg_recebido_em')
            ->values()
            ->map(static function (Mensagem $item) {
                return [
                    'id' => $item->msg_id,
                    'conteudo' => $item->msg_conteudo,
                    'direcao' => $item->msg_direcao,
                    'recebido_em' => $item->msg_recebido_em ? $item->msg_recebido_em->toIso8601String() : null,
                ];
            })
            ->toArray();

        $payload = [
            'lead' => [
                'id' => $lead->led_id,
                'nome' => $lead->led_nome,
                'telefone' => $lead->led_telefone,
                'status' => $lead->led_status,
                'status_conf' => (float) $lead->led_status_conf,
                'valor_total' => $lead->led_valor_total !== null ? (float) $lead->led_valor_total : null,
                'ultima_atualizacao_ia' => $lead->led_ultima_atualizacao_ia ? $lead->led_ultima_atualizacao_ia->toIso8601String() : null,
            ],
            'mensagem' => [
                'id' => $mensagem->msg_id,
                'msgid' => $mensagem->msg_msgid,
                'conteudo' => $mensagem->msg_conteudo,
                'direcao' => $mensagem->msg_direcao,
                'recebido_em' => $mensagem->msg_recebido_em ? $mensagem->msg_recebido_em->toIso8601String() : null,
            ],
            'historico' => $historico,
            'ultima_mensagem' => $mensagem->msg_conteudo,
            'valor_estimado' => $lead->led_valor_total !== null ? (float) $lead->led_valor_total : null,
            'origem' => 'whatsapp',
        ];

        if ($lead->instanciaWhatsapp) {
            $payload['instancia'] = [
                'id' => $lead->instanciaWhatsapp->iwh_id,
                'nome' => $lead->instanciaWhatsapp->iwh_nome ?? null,
            ];
        }

        $tieredService = $factory->make();

        try {
            $response = $tieredService->analyze($payload);

            AuditoriaIa::create([
                'aia_ledid' => $lead->led_id,
                'aia_payload' => $payload,
                'aia_resposta' => $response->toArray(),
                'aia_provider' => $response->detalhes['provider'] ?? 'desconhecido',
                'aia_status' => 'processado',
            ]);

            $detalhes = $response->detalhes;
            $detalhes['texto'] = $mensagem->msg_conteudo;
            $detalhes['mensagem_id'] = $mensagem->msg_id;

            $statusService->applyAutomatic(
                $lead,
                new IaResponse(
                    $response->status,
                    $response->statusConfidence,
                    $response->valorTotal,
                    $response->objecao,
                    $detalhes
                )
            );
        } catch (Throwable $exception) {
            AuditoriaIa::create([
                'aia_ledid' => $lead->led_id,
                'aia_payload' => $payload,
                'aia_resposta' => ['erro' => $exception->getMessage()],
                'aia_provider' => 'tiered',
                'aia_status' => 'erro',
            ]);

            Log::error('Erro ProcessIaJob', [
                'mensagem_id' => $mensagem->msg_id,
                'erro' => $exception->getMessage(),
            ]);
        }
    }
}

