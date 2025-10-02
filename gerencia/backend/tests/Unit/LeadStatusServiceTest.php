<?php

namespace Tests\Unit;

use App\Enums\LeadStatus;
use App\Models\Conta;
use App\Models\Lead;
use App\Services\Ia\IaResponse;
use App\Services\LeadStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadStatusServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function createLead(array $attributes = []): Lead
    {
        $conta = Conta::factory()->create();

        return Lead::factory()->create(array_merge([
            'led_ctaid' => $conta->cta_id,
            'led_status' => LeadStatus::INTERESSADO->value,
            'led_etapa' => LeadStatus::INTERESSADO->value,
        ], $attributes));
    }

    public function test_aplica_status_quando_conf_maior_que_setenta(): void
    {
        $lead = $this->createLead();

        $service = $this->app->make(LeadStatusService::class);

        $result = $service->applyAutomatic(
            $lead,
            new IaResponse(
                LeadStatus::NEGOCIACAO->value,
                0.72,
                null,
                null,
                ['texto' => 'seguindo negociaÃƒÂ§ÃƒÂ£o']
            )
        );

        $this->assertTrue($result);
        $this->assertSame(LeadStatus::NEGOCIACAO->value, $lead->fresh()->led_status);
    }

    public function test_nao_aplica_ganho_sem_keyword_forte(): void
    {
        $lead = $this->createLead([
            'led_status' => LeadStatus::NEGOCIACAO->value,
            'led_etapa' => LeadStatus::NEGOCIACAO->value,
        ]);

        $service = $this->app->make(LeadStatusService::class);

        $result = $service->applyAutomatic(
            $lead,
            new IaResponse(
                LeadStatus::GANHO->value,
                0.90,
                1000,
                null,
                ['texto' => 'acho que deu certo']
            )
        );

        $this->assertFalse($result);
        $this->assertSame(LeadStatus::NEGOCIACAO->value, $lead->fresh()->led_status);
    }

    public function test_aplica_ganho_com_keyword_e_conf_alta(): void
    {
        $lead = $this->createLead([
            'led_status' => LeadStatus::NEGOCIACAO->value,
            'led_etapa' => LeadStatus::NEGOCIACAO->value,
        ]);

        $service = $this->app->make(LeadStatusService::class);

        $result = $service->applyAutomatic(
            $lead,
            new IaResponse(
                LeadStatus::GANHO->value,
                0.90,
                1500,
                null,
                ['texto' => 'paguei o boleto agora']
            )
        );

        $this->assertTrue($result);
        $this->assertSame(LeadStatus::GANHO->value, $lead->fresh()->led_status);
        $this->assertEquals(1500, $lead->fresh()->led_valor_total);
    }
}
