<?php

namespace App\Http\Controllers;

use App\Models\EnderecoModel;
use App\Models\PassageiroModel;
use App\Models\TelModel;
use App\Models\UserModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PassageiroController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PassageiroModel::with('user')->get());
    }

    public function cadastro(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:tbUser,email'],
            'senha' => ['required', 'string', 'min:6', 'max:255'],
            'cpf' => ['required', 'digits:11', 'unique:tbUser,cpf'],
            'fotoPerfil' => ['nullable', 'string', 'max:255'],
            'numeroTelefone' => ['required', 'string', 'max:20'],
            'logradouro' => ['required', 'string', 'max:150'],
            'numero' => ['nullable', 'string', 'max:10'],
            'bairro' => ['nullable', 'string', 'max:100'],
            'cidade' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', 'string', 'size:2'],
            'cep' => ['nullable', 'string', 'max:9'],
            'complemento' => ['nullable', 'string', 'max:100'],
        ]);

        [$user, $passageiro] = DB::transaction(function () use ($data): array {
            $user = UserModel::create([
                'nome' => $data['nome'],
                'email' => mb_strtolower($data['email']),
                'senha' => Hash::make($data['senha']),
                'cpf' => $data['cpf'],
                'fotoPerfil' => $data['fotoPerfil'] ?? null,
                'dataCadastro' => now(),
                'statusConta' => 'Ativa',
            ]);

            $passageiro = PassageiroModel::create([
                'userId' => $user->userId,
                'status' => 'Ativo',
            ]);

            TelModel::create([
                'userId' => $user->userId,
                'numeroTelefone' => $data['numeroTelefone'],
            ]);

            EnderecoModel::create([
                'userId' => $user->userId,
                'logradouro' => $data['logradouro'],
                'numero' => $data['numero'] ?? null,
                'bairro' => $data['bairro'] ?? null,
                'cidade' => $data['cidade'] ?? null,
                'estado' => $data['estado'] ?? null,
                'cep' => $data['cep'] ?? null,
                'complemento' => $data['complemento'] ?? null,
            ]);

            return [$user, $passageiro];
        });

        return response()->json([
            'message' => 'Passageiro cadastrado com sucesso.',
            'user' => $user,
            'passageiro' => $passageiro,
            'token' => $user->createToken('app-passageiro')->plainTextToken,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string'],
            'senha' => ['required', 'string'],
        ]);

        $login = trim($data['email']);
        $user = UserModel::query()
            ->where('email', $login)
            ->when(preg_match('/^\d{11}$/', preg_replace('/\D/', '', $login)), function ($query) use ($login): void {
                $query->orWhere('cpf', preg_replace('/\D/', '', $login));
            })
            ->first();

        if (! $user || $user->statusConta !== 'Ativa' || ! Hash::check($data['senha'], $user->senha)) {
            throw ValidationException::withMessages(['email' => 'E-mail/CPF ou senha inválidos.']);
        }

        $passageiro = PassageiroModel::where('userId', $user->userId)->first();
        if (! $passageiro || $passageiro->status !== 'Ativo') {
            throw ValidationException::withMessages(['email' => 'Conta de passageiro indisponível.']);
        }

        return response()->json([
            'success' => true,
            'user' => $user,
            'passageiro' => $passageiro,
            'token' => $user->createToken('app-passageiro')->plainTextToken,
        ]);
    }
}
