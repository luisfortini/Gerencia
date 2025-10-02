<?php

namespace App\Http\Middleware;

use App\Models\Conta;
use Closure;
use Illuminate\Http\Request;

class ResolveTenant
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Usuario nao autenticado.');
        }

        $contaId = $user->usr_ctaid;

        if ($user->usr_superadmin) {
            $headerConta = $request->header('X-Conta-Id');

            if ($headerConta !== null && $headerConta !== '') {
                $contaId = (int) $headerConta;
            }

            if (! $contaId) {
                $contaId = Conta::query()->value('cta_id');
            }
        } elseif ($request->hasHeader('X-Conta-Id')) {
            $contaId = (int) $request->header('X-Conta-Id');
        }

        if (! $contaId) {
            abort(403, 'Conta invalida.');
        }

        $conta = Conta::find($contaId);

        if (! $conta) {
            abort(403, 'Conta invalida.');
        }

        app()->instance('tenant', $conta);
        $request->attributes->set('tenant', $conta);

        return $next($request);
    }
}
