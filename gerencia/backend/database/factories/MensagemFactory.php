<?php

namespace Database\Factories;

use App\Models\InstanciaWhatsapp;
use App\Models\Lead;
use App\Models\Mensagem;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MensagemFactory extends Factory
{
    protected $model = Mensagem::class;

    public function definition(): array
    {
        return [
            'msg_ledid' => Lead::factory(),
            'msg_iwhid' => InstanciaWhatsapp::factory(),
            'msg_direcao' => 'in',
            'msg_conteudo' => $this->faker->sentence(),
            'msg_msgid' => Str::uuid()->toString(),
            'msg_recebido_em' => now(),
        ];
    }
}
