<?php

namespace Database\Factories;

use App\Models\Conta;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        return [
            'led_ctaid' => Conta::factory(),
            'led_nome' => $this->faker->name(),
            'led_telefone' => $this->faker->phoneNumber(),
            'led_email' => $this->faker->unique()->safeEmail(),
            'led_status' => 'novo',
            'led_etapa' => 'novo',
            'led_status_conf' => 0.5,
        ];
    }
}
