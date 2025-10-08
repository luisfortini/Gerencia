<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || (! $user->usr_admin && ! $user->usr_superadmin)) {
            abort(403, 'Somente administradores.');
        }

        return $next($request);
    }
}
