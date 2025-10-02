<?php

namespace Database\Factories;

use App\Models\Conta;
use App\Models\InstanciaWhatsapp;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class InstanciaWhatsappFactory extends Factory
{
    protected $model = InstanciaWhatsapp::class;

    public function definition(): array
    {
        return [
            'iwh_ctaid' => Conta::factory(),
            'iwh_nome' => 'InstÃƒÂ¢ncia '.$this->faker->word(),
            'iwh_status' => 'ativo',
            'iwh_api_key' => Str::random(16),
            'iwh_webhook_token' => Str::random(24),
        ];
    }
}
