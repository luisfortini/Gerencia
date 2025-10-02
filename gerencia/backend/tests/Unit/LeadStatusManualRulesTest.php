<?php

namespace Tests\Unit;

use App\Enums\LeadStatus;
use App\Models\Conta;
use App\Models\Lead;
use App\Models\Usuario;
use App\Services\LeadStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadStatusManualRulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setupLeadAndUser(): array
    {
        $conta = Conta::factory()->create();
        $usuario = Usuario::factory()->create([
            'usr_ctaid' => $conta->cta_id,
            'usr_papel' => 'gestor',
        ]);

        $lead = Lead::factory()->create([
            'led_ctaid' => $conta->cta_id,
            'led_status' => LeadStatus::NEGOCIACAO->value,
            'led_etapa' => LeadStatus::NEGOCIACAO->value,
        ]);

        return [$lead, $usuario];
    }

    public function test_retroceder_exige_motivo(): void
    {
        [$lead, $usuario] = $this->setupLeadAndUser();

        $service = $this->app->make(LeadStatusService::class);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Motivo obrigatÃƒÂ³rio ao retroceder etapa.');

        $service->applyManual(
            $lead,
            LeadStatus::INTERESSADO->value,
            $usuario,
            null,
            null
        );
    }

    public function test_ganho_manual_exige_valor_total(): void
    {
        [$lead, $usuario] = $this->setupLeadAndUser();

        $service = $this->app->make(LeadStatusService::class);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Valor total obrigatÃƒÂ³rio para Ganho.');

        $service->applyManual(
            $lead,
            LeadStatus::GANHO->value,
            $usuario,
            null,
            null
        );
    }
}
