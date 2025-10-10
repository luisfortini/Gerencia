<?php

namespace App\Services;

use App\Models\Conta;
use App\Models\Lead;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeadAssignmentService
{
    public function assign(Lead $lead, ?int $usuarioId, Conta $conta, bool $force = false, bool $failHard = true): bool
    {
        if ($usuarioId === null) {
            if ($lead->led_responsavel_usrid === null) {
                return false;
            }

            if (! $force) {
                return false;
            }

            return DB::transaction(function () use ($lead) {
                $lead->led_responsavel_usrid = null;
                $lead->save();

                return true;
            });
        }

        $usuario = Usuario::query()
            ->where('usr_ctaid', $conta->cta_id)
            ->where('usr_id', $usuarioId)
            ->where('usr_ativo', true)
            ->first();

        if (! $usuario) {
            if ($failHard) {
                throw ValidationException::withMessages([
                    'led_responsavel_usrid' => 'Responsavel invalido para esta conta.',
                ]);
            }

            return false;
        }

        if (! $force && $lead->led_responsavel_usrid !== null && $lead->led_responsavel_usrid !== $usuario->usr_id) {
            return false;
        }

        if ($lead->led_responsavel_usrid === $usuario->usr_id) {
            return false;
        }

        return DB::transaction(function () use ($lead, $usuario) {
            $lead->led_responsavel_usrid = $usuario->usr_id;
            $lead->save();

            return true;
        });
    }
}

