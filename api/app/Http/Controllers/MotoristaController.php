<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MotoristaModel;
use App\Models\UserModel;
use App\Models\EnderecoModel;
use App\Models\TelModel;
use App\Models\VeiculoModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MotoristaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $motorista = new MotoristaModel();

        $motoristas = $motorista->all();

        return response()->json($motoristas);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        
    }

    public function cadastro (Request $request)
    {
        $motorista = new MotoristaModel();
        $user = new UserModel();
        $endereco = new EnderecoModel();
        $telefone = new TelModel();
        $veiculo = new VeiculoModel();

        try{

            $user ->nome = $request->input('nome');
            $user ->email = $request->input('email');
            $user ->senha = Hash::make($request->input('senha'));
            $user ->cpf = $request->input('cpf');
            $user ->fotoPerfil = $request->input('fotoPerfil');
            $user ->dataCadastro = now();
            $user ->statusConta = "Ativa";

            $user->save();
  
            $motorista->userId = $user->id;
            $motorista->cnh = $request->cnh;
            $motorista->validadeCNH = $request->validadeCNH;
            $motorista->avaliacaoMedia = 0;
            $motorista->statusMotorista = "Pendente";

            $motorista->save();

            $veiculo->motoristaId = $motorista->id;
            $veiculo->marca = $request->input('marca');
            $veiculo->modelo = $request->input('modelo');
            $veiculo->placa = $request->input('placa');
            $veiculo->cor = $request->input('cor');
            $veiculo->anoFabricacao = $request->input('anoFabricacao');
            $veiculo->anoModelo = $request->input('anoModelo');
            $veiculo->categoria = $request->input('categoria');

            $veiculo->save();

            $telefone->userId = $user->id;
            $telefone->numeroTelefone = $request->input('numeroTelefone');

            $telefone->save();

            $endereco->userId = $user->id;
            $endereco->logradouro = $request->input('logradouro');
            $endereco->numero = $request->input('numero');
            $endereco->bairro = $request->input('bairro');
            $endereco->cidade = $request->input('cidade');  
            $endereco->estado = $request->input('estado');
            $endereco->cep = $request->input('cep');
            $endereco->complemento = $request->input('complemento');

            $endereco->save();

            return response()->json([
                'message' => 'Motorista cadastrado com sucesso!',
                'motorista' => $motorista,
                'endereco' => $endereco,
                'telefone' => $telefone,
                'veiculo' => $veiculo
            ], 201);
        }catch(\Exception $e){
            return response()->json([
                'message' => 'Erro ao cadastrar motorista: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request){
        $email = $request->input('email');
        $senha = $request->input('senha');

        // 1. Busca o usuário pelo e-mail
        $user = UserModel::where('email', $email)->first();

        // Se o usuário não existe ou a senha está incorreta
        if (!$user || !Hash::check($senha, $user->senha)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciais inválidas'
            ], 401);
        }

        // 2. Descobre qual é o ID do usuário (ajustando caso a coluna na tbUser se chame 'userId' ou 'id')
        $userId = $user->userId ?? $user->id;

        // 3. Busca o motorista explicitando a coluna 'userId'
        $motorista = MotoristaModel::where('userId', $userId)->first();

        // Se o motorista não for encontrado
        if (!$motorista) {
            return response()->json([
                'success' => false,
                'message' => 'Passageiro não encontrado para este usuário',
                'user_id_testado' => $userId
            ], 404);
        }

        // Sucesso no login
        return response()->json([
            'success' => true,
            'message' => 'Login realizado com sucesso',
            'motorista' => $motorista,
            'user' => $user
        ], 200);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
