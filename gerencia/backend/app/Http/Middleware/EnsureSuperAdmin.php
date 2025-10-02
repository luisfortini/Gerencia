<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || ! $user->usr_superadmin) {
            abort(403, 'Somente super administradores.');
        }

        return $next($request);
    }
}
