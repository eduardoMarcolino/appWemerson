<?php

namespace App\Http\Controllers;

use App\Models\MotoristaModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['passageiro', 'motorista', 'telefones', 'enderecos']);
        $passageiro = $user->passageiro;
        $motorista = $user->motorista;

        if ($user->statusConta !== 'Ativa'
            || (! $passageiro && ! $motorista)
            || ($passageiro && $passageiro->status !== 'Ativo')
            || ($motorista && $motorista->statusMotorista === 'Bloqueado')) {
            $request->user()->currentAccessToken()?->delete();
            abort(403, 'Esta conta não está mais ativa.');
        }

        return response()->json([
            'user' => $user,
            'passageiro' => $passageiro,
            'motorista' => $motorista ? MotoristaModel::with('veiculos')->find($motorista->motoristaId) : null,
            'telefones' => $user->telefones,
            'enderecos' => $user->enderecos,
        ]);
    }
}
