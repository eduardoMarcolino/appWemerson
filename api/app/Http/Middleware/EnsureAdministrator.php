<?php

namespace App\Http\Middleware;

use App\Models\UserModel;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdministrator
{
    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->session()->get('admin_user_id');
        $user = $userId ? UserModel::with('administrador')->find($userId) : null;

        if (! $user
            || $user->statusConta !== 'Ativa'
            || ! $user->administrador
            || ! in_array($user->administrador->nivelAcesso, ['Master', 'Operador'], true)) {
            $request->session()->forget('admin_user_id');

            return redirect()->route('admin.login');
        }

        $request->attributes->set('admin_user', $user);
        View::share('adminUser', $user);

        return $next($request);
    }
}
