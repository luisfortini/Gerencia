<?php

namespace Database\Seeders;

use App\Enums\LeadStatus;
use App\Models\Conta;
use App\Models\InstanciaWhatsapp;
use App\Models\Lead;
use App\Models\Mensagem;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ContaSeeder extends Seeder
{
    public function run(): void
    {
        Usuario::firstOrCreate(
            ['usr_email' => 'superadmin@gerencia.dev'],
            [
                'usr_nome' => 'Super Admin',
                'usr_senha' => Hash::make('password'),
                'usr_papel' => 'superadmin',
                'usr_superadmin' => true,
                'usr_admin' => true,
                'usr_ativo' => true,
            ]
        );

        $conta = Conta::firstOrCreate(
            ['cta_slug' => 'acme'],
            [
                'cta_nome' => 'ACME Vendas',
                'cta_plano_tipo' => 'mensal',
                'cta_limite_instancias' => 2,
                'cta_retencao_dias' => 30,
                'cta_status' => 'ativo',
            ]
        );

        $gestor = Usuario::firstOrCreate(
            ['usr_email' => 'gestor@acme.dev'],
            [
                'usr_ctaid' => $conta->cta_id,
                'usr_nome' => 'Gestor ACME',
                'usr_senha' => Hash::make('password'),
                'usr_papel' => 'gestor',
                'usr_superadmin' => false,
                'usr_admin' => true,
                'usr_ativo' => true,
            ]
        );

        $operador = Usuario::firstOrCreate(
            ['usr_email' => 'operador@acme.dev'],
            [
                'usr_ctaid' => $conta->cta_id,
                'usr_nome' => 'Operador ACME',
                'usr_senha' => Hash::make('password'),
                'usr_papel' => 'operador',
                'usr_superadmin' => false,
                'usr_admin' => false,
                'usr_ativo' => true,
            ]
        );

        $instancia = InstanciaWhatsapp::firstOrCreate(
            ['iwh_webhook_token' => 'token-acme'],
            [
                'iwh_ctaid' => $conta->cta_id,
                'iwh_nome' => 'WhatsApp ACME',
                'iwh_status' => 'ativo',
                'iwh_api_key' => 'api-key-acme',
            ]
        );

        $statusOptions = LeadStatus::cases();

        for ($i = 1; $i <= 10; $i++) {
            $status = $statusOptions[array_rand($statusOptions)]->value;

            $lead = Lead::updateOrCreate(
                ['led_ctaid' => $conta->cta_id, 'led_email' => "lead{$i}@acme.dev"],
                [
                    'led_iwhid' => $instancia->iwh_id,
                    'led_responsavel_usrid' => $i % 2 === 0 ? $gestor->usr_id : $operador->usr_id,
                    'led_nome' => "Lead {$i}",
                    'led_telefone' => '+551199999'.str_pad((string)$i, 2, '0', STR_PAD_LEFT),
                    'led_status' => $status,
                    'led_etapa' => $status,
                    'led_status_conf' => rand(50, 95) / 100,
                    'led_valor_total' => rand(5000, 15000),
                ]
            );

            for ($m = 0; $m < 3; $m++) {
                Mensagem::updateOrCreate(
                    ['msg_msgid' => Str::uuid()->toString()],
                    [
                        'msg_ledid' => $lead->led_id,
                        'msg_iwhid' => $instancia->iwh_id,
                        'msg_direcao' => $m % 2 === 0 ? 'in' : 'out',
                        'msg_conteudo' => "Mensagem {$m} do lead {$i}",
                        'msg_recebido_em' => now()->subMinutes($m),
                    ]
                );
            }
        }
    }
}
