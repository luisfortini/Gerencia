<?php

namespace Tests\Feature;

use App\Models\AuditoriaIa;
use App\Models\Conta;
use App\Models\Lead;
use App\Models\LogStatusLead;
use App\Models\Mensagem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RetencaoCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_remove_registros_antigos(): void
    {
        $conta = Conta::factory()->create(['cta_retencao_dias' => 1]);
        $lead = Lead::factory()->create(['led_ctaid' => $conta->cta_id]);

        $mensagem = Mensagem::factory()->create([
            'msg_ledid' => $lead->led_id,
            'msg_recebido_em' => now()->subDays(5),
        ]);
        $mensagem->forceFill(['created_at' => now()->subDays(5)])->save();

        $auditoria = AuditoriaIa::create([
            'aia_ledid' => $lead->led_id,
            'aia_payload' => ['foo' => 'bar'],
            'aia_resposta' => ['status' => 'novo'],
            'aia_provider' => 'mock',
            'aia_status' => 'processado',
        ]);
        $auditoria->forceFill(['created_at' => now()->subDays(5)])->save();

        $log = LogStatusLead::create([
            'lsl_ledid' => $lead->led_id,
            'lsl_status_anterior' => 'novo',
            'lsl_status_novo' => 'qualificado',
            'lsl_origem' => 'ia',
        ]);
        $log->forceFill(['created_at' => now()->subDays(5)])->save();

        $this->artisan('retencao:purge')->assertExitCode(0);

        $this->assertDatabaseMissing('mensagem', ['msg_id' => $mensagem->msg_id]);
        $this->assertDatabaseMissing('auditoria_ia', ['aia_id' => $auditoria->aia_id]);
        $this->assertDatabaseMissing('log_status_lead', ['lsl_id' => $log->lsl_id]);
    }
}
