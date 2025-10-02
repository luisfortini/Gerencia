<?php

namespace Tests\Feature;

use App\Models\Conta;
use App\Models\InstanciaWhatsapp;
use App\Models\Mensagem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebhookDeduplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_nao_duplica_mensagem_por_msgid(): void
    {
        $conta = Conta::factory()->create();

        $instancia = InstanciaWhatsapp::factory()->create([
            'iwh_ctaid' => $conta->cta_id,
            'iwh_webhook_token' => 'token-teste',
        ]);

        $payload = [
            'mensagem_id' => 'abc123',
            'telefone' => '+5511988887777',
            'conteudo' => 'OlÃƒÂ¡, eu jÃƒÂ¡ paguei o boleto',
            'direcao' => 'in',
            'nome' => 'Lead Teste',
            'email' => 'lead@teste.dev',
            'recebido_em' => now()->toIso8601String(),
        ];

        $this->postJson('/api/webhook/evolution', $payload, ['X-Webhook-Token' => 'token-teste'])->assertOk();
        $this->postJson('/api/webhook/evolution', $payload, ['X-Webhook-Token' => 'token-teste'])->assertOk();

        $this->assertSame(1, Mensagem::count());
    }
}
