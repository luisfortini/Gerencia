<?php

namespace Database\Seeders;

use App\Models\Objecao;
use Illuminate\Database\Seeder;

class ObjecaoBaseSeeder extends Seeder
{
    public function run(): void
    {
        $objecoes = ['preÃƒÂ§o', 'tempo', 'concorrente', 'nÃƒÂ£o interessado', 'sem orÃƒÂ§amento'];

        foreach ($objecoes as $nome) {
            Objecao::firstOrCreate([
                'obj_ctaid' => null,
                'obj_nome' => $nome
            ], [
                'obj_tipo' => 'base',
                'obj_ativo' => true
            ]);
        }
    }
}
