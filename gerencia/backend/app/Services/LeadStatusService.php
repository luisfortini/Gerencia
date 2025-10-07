<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Enums\LeadStatusOrigem;
use App\Models\Lead;
use App\Models\LogStatusLead;
use App\Models\Objecao;
use App\Models\Usuario;
use App\Services\Ia\IaResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadStatusService
{
    public function applyAutomatic(Lead $lead, IaResponse $response): bool
    {
        if ($response->statusConfidence < 0.70) {
            return false;
        }

        $novoStatus = $response->status;

        if ($novoStatus === LeadStatus::GANHO->value) {
            if ($response->statusConfidence < 0.85 || ! strong_keyword_detected(Arr::get($response->detalhes, 'texto', ''))) {
                return false;
            }
        }

        $retrocedeu = $this->retrocedeu($lead->led_status, $novoStatus);

        $extras = [
            'status_conf' => $response->statusConfidence,
            'valor_total' => $response->valorTotal,
            'objecao' => $response->objecao,
        ];

        if ($retrocedeu) {
            $extras['motivo'] = Arr::get($response->detalhes, 'motivo_retrocesso')
                ?? Arr::get($response->detalhes, 'observacoes_relevantes')
                ?? 'Retrocesso automatico IA';
        }

        return $this->persistStatus($lead, $novoStatus, LeadStatusOrigem::IA, null, $extras);
    }

    public function applyManual(Lead $lead, string $novoStatus, Usuario $usuario, ?string $motivo, ?float $valorTotal = null): bool
    {
        if ($lead->led_status === LeadStatus::GANHO->value && $novoStatus !== LeadStatus::GANHO->value) {
            throw new \InvalidArgumentException('Ganho nao pode ser revertido sem registrar retrocesso.');
        }

        if (! $this->podeMudarEtapa($lead->led_status, $novoStatus)) {
            throw new \InvalidArgumentException('Transicao de status nao permitida.');
        }

        if ($novoStatus === LeadStatus::GANHO->value && $valorTotal === null) {
            throw new \InvalidArgumentException('Valor total obrigatorio para Ganho.');
        }

        if ($this->retrocedeu($lead->led_status, $novoStatus) && empty($motivo)) {
            throw new \InvalidArgumentException('Motivo obrigatorio ao retroceder etapa.');
        }

        return $this->persistStatus($lead, $novoStatus, LeadStatusOrigem::HUMANO, $usuario, [
            'motivo' => $motivo,
            'valor_total' => $valorTotal,
        ]);
    }

    protected function persistStatus(Lead $lead, string $novoStatus, LeadStatusOrigem $origem, ?Usuario $usuario, array $extras = []): bool
    {
        if ($lead->led_status === $novoStatus) {
            return false;
        }

        return DB::transaction(function () use ($lead, $novoStatus, $origem, $usuario, $extras) {
            $statusAnterior = $lead->led_status;

            $lead->led_status = $novoStatus;
            $lead->led_etapa = $novoStatus;
            $lead->led_status_conf = $extras['status_conf'] ?? $lead->led_status_conf;

            if (array_key_exists('valor_total', $extras) && $extras['valor_total'] !== null) {
                $lead->led_valor_total = $extras['valor_total'];
            }

            $lead->led_ultima_atualizacao_ia = now();
            $lead->save();

            LogStatusLead::create([
                'lsl_ledid' => $lead->led_id,
                'lsl_status_anterior' => $statusAnterior,
                'lsl_status_novo' => $novoStatus,
                'lsl_origem' => $origem->value,
                'lsl_motivo' => $extras['motivo'] ?? null,
                'lsl_usrid' => $usuario?->usr_id,
            ]);

            if (! empty($extras['objecao'])) {
                $this->registrarObjecao($lead, (string) $extras['objecao']);
            }

            return true;
        });
    }

    protected function retrocedeu(string $anterior, string $novo): bool
    {
        $ordem = [
            LeadStatus::NOVO->value => 1,
            LeadStatus::QUALIFICADO->value => 2,
            LeadStatus::INTERESSADO->value => 3,
            LeadStatus::NEGOCIACAO->value => 4,
            LeadStatus::FOLLOW_UP->value => 5,
            LeadStatus::GANHO->value => 6,
            LeadStatus::PERDIDO->value => 7,
        ];

        return ($ordem[$novo] ?? 0) < ($ordem[$anterior] ?? 0);
    }

    protected function podeMudarEtapa(string $anterior, string $novo): bool
    {
        if ($anterior === LeadStatus::GANHO->value && $novo !== LeadStatus::GANHO->value) {
            return false;
        }

        return true;
    }

    protected function registrarObjecao(Lead $lead, string $objecaoNome): void
    {
        $conta = $lead->conta;

        if (! $conta) {
            return;
        }

        Objecao::firstOrCreate(
            [
                'obj_ctaid' => $conta->cta_id,
                'obj_nome' => $objecaoNome,
            ],
            [
                'obj_tipo' => 'custom',
                'obj_ativo' => true,
            ]
        );
    }
}