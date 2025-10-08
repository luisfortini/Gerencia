<?php

namespace Database\Factories;

use App\Models\Conta;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;

class UsuarioFactory extends Factory
{
    protected $model = Usuario::class;

    public function definition(): array
    {
        return [
            'usr_ctaid' => Conta::factory(),
            'usr_nome' => $this->faker->name(),
            'usr_email' => $this->faker->unique()->safeEmail(),
            'usr_senha' => bcrypt('password'),
            'usr_papel' => 'operador',
            'usr_superadmin' => false,
            'usr_admin' => false,
            'usr_ativo' => true,
        ];
    }
}
