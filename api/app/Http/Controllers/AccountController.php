<?php

namespace App\Http\Controllers;

use App\Models\EnderecoModel;
use App\Models\MotoristaModel;
use App\Models\TelModel;
use App\Models\UserModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class AccountController extends Controller
{
    public function updatePhoto(Request $request): JsonResponse
    {
        $user = $request->user()->load(['passageiro', 'motorista', 'administrador']);
        abort_unless(
            ($user->passageiro || $user->motorista) && ! $user->administrador,
            403,
            'Somente contas de passageiro ou motorista podem alterar a foto de perfil.',
        );

        $data = $request->validate([
            'foto' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        $directory = 'profile-photos/'.$user->userId;
        $previousPhoto = $user->fotoPerfil;
        $photoPath = $data['foto']->store($directory, 'public');
        abort_if(! is_string($photoPath), 500, 'Não foi possível salvar a foto de perfil.');

        try {
            DB::transaction(function () use ($user, $photoPath): void {
                $user->fotoPerfil = $photoPath;
                $user->save();
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($photoPath);
            throw $exception;
        }

        if (is_string($previousPhoto) && dirname($previousPhoto) === $directory) {
            Storage::disk('public')->delete($previousPhoto);
        }

        return response()->json([
            'user' => $user->refresh(),
            'fotoPerfil' => $photoPath,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user()->load(['passageiro', 'motorista']);
        abort_unless(
            $user->passageiro || $user->motorista,
            403,
            'Somente contas de passageiro ou motorista podem ser alteradas por este endpoint.',
        );

        $data = $request->validate([
            'nome' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('tbUser', 'email')->ignore($user->userId, 'userId')],
            'cpf' => ['required', 'digits:11', Rule::unique('tbUser', 'cpf')->ignore($user->userId, 'userId')],
            'numeroTelefone' => ['required', 'string', 'max:20'],
            'logradouro' => ['required', 'string', 'max:150'],
            'numero' => ['nullable', 'string', 'max:10'],
            'complemento' => ['nullable', 'string', 'max:100'],
            'bairro' => ['nullable', 'string', 'max:100'],
            'cidade' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', 'string', 'size:2'],
            'cep' => ['nullable', 'digits:8'],
            'senhaAtual' => ['required', 'string', 'max:255'],
            'novaSenha' => ['nullable', 'string', 'min:8', 'max:255', 'confirmed'],
        ]);

        $this->assertCurrentPassword($user, $data['senhaAtual']);

        DB::transaction(function () use ($data, $user): void {
            $user->fill([
                'nome' => $data['nome'],
                'email' => mb_strtolower(trim($data['email'])),
                'cpf' => $data['cpf'],
            ]);
            if (! empty($data['novaSenha'])) {
                $user->senha = Hash::make($data['novaSenha']);
            }
            $user->save();

            TelModel::updateOrCreate(
                ['userId' => $user->userId],
                ['numeroTelefone' => $data['numeroTelefone']],
            );
            EnderecoModel::updateOrCreate(
                ['userId' => $user->userId],
                [
                    'logradouro' => $data['logradouro'],
                    'numero' => $data['numero'] ?? null,
                    'complemento' => $data['complemento'] ?? null,
                    'bairro' => $data['bairro'] ?? null,
                    'cidade' => $data['cidade'] ?? null,
                    'estado' => $data['estado'] ?? null,
                    'cep' => $data['cep'] ?? null,
                ],
            );

            if (! empty($data['novaSenha'])) {
                $user->tokens()->where('id', '!=', $user->currentAccessToken()?->getKey())->delete();
            }
        });

        $user->refresh()->load(['passageiro', 'motorista', 'telefones', 'enderecos']);

        return response()->json([
            'user' => $user,
            'passageiro' => $user->passageiro,
            'motorista' => $user->motorista ? MotoristaModel::with('veiculos')->find($user->motorista->motoristaId) : null,
            'telefones' => $user->telefones,
            'enderecos' => $user->enderecos,
        ]);
    }

    public function deactivate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'senhaAtual' => ['required', 'string', 'max:255'],
        ]);
        $user = $request->user()->load('passageiro');
        abort_unless($user->passageiro || $user->motorista, 403);
        $this->assertCurrentPassword($user, $data['senhaAtual']);
        $previousPhoto = $user->fotoPerfil;
        $photoDirectory = 'profile-photos/'.$user->userId;

        DB::transaction(function () use ($user): void {
            $user->statusConta = 'Inativa';
            $user->fotoPerfil = null;
            $user->save();
            $user->passageiro?->update(['status' => 'Inativo']);
            $user->tokens()->delete();
        });

        if (is_string($previousPhoto) && dirname($previousPhoto) === $photoDirectory) {
            Storage::disk('public')->delete($previousPhoto);
        }

        return response()->json([
            'message' => 'Conta desativada. A foto de perfil foi removida; registros associados às corridas foram mantidos.',
        ]);
    }

    private function assertCurrentPassword(UserModel $user, string $password): void
    {
        if (! Hash::check($password, $user->senha)) {
            throw ValidationException::withMessages([
                'senhaAtual' => 'A senha atual está incorreta.',
            ]);
        }
    }
}
