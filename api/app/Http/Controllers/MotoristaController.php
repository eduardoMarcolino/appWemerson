<?php

namespace App\Http\Controllers;

use App\Models\EnderecoModel;
use App\Models\MotoristaModel;
use App\Models\TelModel;
use App\Models\UserModel;
use App\Models\VeiculoModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class MotoristaController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(MotoristaModel::with(['user', 'veiculos'])->get());
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
            'cnh' => ['required', 'string', 'max:20'],
            'validadeCNH' => ['required', 'date', 'after:today'],
            'marca' => ['required', 'string', 'max:50'],
            'modelo' => ['required', 'string', 'max:50'],
            'placa' => ['required', 'string', 'max:10', 'unique:tbVeiculo,placa'],
            'cor' => ['nullable', 'string', 'max:30'],
            'anoFabricacao' => ['nullable', 'integer', 'between:1900,2100'],
            'anoModelo' => ['nullable', 'integer', 'between:1900,2100'],
            'categoria' => ['required', 'in:Economico,Comfort,SUV,Moto'],
        ]);

        [$user, $motorista] = DB::transaction(function () use ($data): array {
            $user = UserModel::create([
                'nome' => $data['nome'],
                'email' => mb_strtolower($data['email']),
                'senha' => Hash::make($data['senha']),
                'cpf' => $data['cpf'],
                'fotoPerfil' => $data['fotoPerfil'] ?? null,
                'dataCadastro' => now(),
                'statusConta' => 'Ativa',
            ]);

            $motorista = MotoristaModel::create([
                'userId' => $user->userId,
                'cnh' => $data['cnh'],
                'validadeCNH' => $data['validadeCNH'],
                'avaliacaoMedia' => 0,
                'statusMotorista' => app()->environment('local', 'testing') ? 'Aprovado' : 'Pendente',
            ]);

            VeiculoModel::create([
                'motoristaId' => $motorista->motoristaId,
                'marca' => $data['marca'],
                'modelo' => $data['modelo'],
                'placa' => strtoupper($data['placa']),
                'cor' => $data['cor'] ?? null,
                'anoFabricacao' => $data['anoFabricacao'] ?? null,
                'anoModelo' => $data['anoModelo'] ?? null,
                'categoria' => $data['categoria'],
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

            return [$user, $motorista];
        });

        return response()->json([
            'message' => 'Motorista cadastrado com sucesso.',
            'user' => $user,
            'motorista' => $motorista,
            'token' => $user->createToken('app-motorista')->plainTextToken,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string'],
            'senha' => ['required', 'string'],
        ]);

        $user = UserModel::where('email', trim($data['email']))->first();
        if (! $user || $user->statusConta !== 'Ativa' || ! Hash::check($data['senha'], $user->senha)) {
            throw ValidationException::withMessages(['email' => 'E-mail ou senha inválidos.']);
        }

        $motorista = MotoristaModel::where('userId', $user->userId)->first();
        if (! $motorista || $motorista->statusMotorista === 'Bloqueado') {
            throw ValidationException::withMessages(['email' => 'Conta de motorista indisponível.']);
        }

        return response()->json([
            'success' => true,
            'user' => $user,
            'motorista' => $motorista,
            'token' => $user->createToken('app-motorista')->plainTextToken,
        ]);
    }
}
