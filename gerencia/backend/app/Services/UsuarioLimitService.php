<?php

namespace App\Services;

use App\Models\Conta;
use App\Models\Usuario;

class UsuarioLimitService
{
    public function assertCanAddActiveUsers(Conta $conta, int $activeToAdd = 1, ?Usuario $ignore = null): void
    {
        $limite = (int) ($conta->cta_limite_usuarios ?? 0);

        if ($limite <= 0) {
            return;
        }

        $query = Usuario::query()
            ->where('usr_ctaid', $conta->cta_id)
            ->where('usr_ativo', true);

        if ($ignore) {
            $query->where('usr_id', '!=', $ignore->usr_id);
        }

        $totalAtivos = $query->count();

        abort_if($totalAtivos + $activeToAdd > $limite, 422, 'Limite de usuarios ativos atingido.');
    }
}

