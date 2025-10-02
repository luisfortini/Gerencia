<?php

namespace Database\Factories;

use App\Models\Conta;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ContaFactory extends Factory
{
    protected $model = Conta::class;

    public function definition(): array
    {
        $slug = Str::slug($this->faker->company());

        return [
            'cta_nome' => $this->faker->company(),
            'cta_slug' => $slug,
            'cta_plano_tipo' => 'mensal',
            'cta_limite_instancias' => 2,
            'cta_retencao_dias' => 30,
            'cta_status' => 'ativo',
        ];
    }
}
