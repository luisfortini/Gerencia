<?php

namespace Tests\Feature;

use App\Models\Conta;
use App\Models\Lead;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_nao_acessa_lead_de_outra_conta(): void
    {
        $contaA = Conta::factory()->create();
        $contaB = Conta::factory()->create();

        $usuarioA = Usuario::factory()->create([
            'usr_ctaid' => $contaA->cta_id,
        ]);

        $leadB = Lead::factory()->create([
            'led_ctaid' => $contaB->cta_id,
        ]);

        Sanctum::actingAs($usuarioA);

        $this->getJson("/api/leads/{$leadB->led_id}")
            ->assertStatus(403);
    }
}
