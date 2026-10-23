<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountUserResource;
use App\Http\Resources\DriverAccountResource;
use App\Models\MotoristaModel;
use App\Support\MobileTokenIssuer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function refresh(Request $request, MobileTokenIssuer $tokenIssuer): JsonResponse
    {
        $user = $request->user();
        $currentToken = $user->currentAccessToken();

        if (! $currentToken || ! method_exists($currentToken, 'delete')) {
            abort(401, 'Token de acesso inválido. Faça login novamente.');
        }

        $newToken = $tokenIssuer->issue($user, $currentToken->name);
        $currentToken->delete();

        return response()->json([
            'token' => $newToken->plainTextToken,
            'expires_at' => $newToken->accessToken->expires_at?->toIso8601String(),
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['passageiro', 'motorista', 'telefones', 'enderecos']);
        $passageiro = $user->passageiro;
        $motorista = $user->motorista;

        if ($user->statusConta !== 'Ativa'
            || (! $passageiro && ! $motorista)
            || ($passageiro && $passageiro->status !== 'Ativo')
            || ($motorista && $motorista->statusMotorista !== 'Aprovado')) {
            $request->user()->currentAccessToken()?->delete();
            abort(403, 'Esta conta não está mais ativa.');
        }

        return response()->json([
            'user' => AccountUserResource::make($user)->resolve($request),
            'passageiro' => $passageiro ? [
                'passageiroId' => $passageiro->passageiroId,
                'status' => $passageiro->status,
            ] : null,
            'motorista' => $motorista
                ? DriverAccountResource::make(MotoristaModel::with('veiculos')->find($motorista->motoristaId))->resolve($request)
                : null,
            'telefones' => $user->telefones->map(fn ($phone): array => [
                'numeroTelefone' => $phone->numeroTelefone,
            ])->all(),
            'enderecos' => $user->enderecos->map(fn ($address): array => [
                'logradouro' => $address->logradouro,
                'numero' => $address->numero,
                'complemento' => $address->complemento,
                'bairro' => $address->bairro,
                'cidade' => $address->cidade,
                'estado' => $address->estado,
                'cep' => $address->cep,
            ])->all(),
        ]);
    }
}
