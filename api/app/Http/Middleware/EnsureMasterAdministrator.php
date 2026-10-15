<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMasterAdministrator
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->attributes->get('admin_user');
        abort_unless($user?->administrador?->nivelAcesso === 'Master', Response::HTTP_FORBIDDEN);

        return $next($request);
    }
}
