<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\admModel;
use App\Models\UserModel;
use App\Models\EnderecoModel;
use App\Models\TelModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class admController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
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

    public function cadastro(Request $request)
    {
        $adm = new admModel();
        $user = new UserModel();
        $endereco = new EnderecoModel();
        $telefone = new TelModel();

        try{
            $user ->nome = $request->input('nome');
            $user ->email = $request->input('email');
            $user ->senha = Hash::make($request->input('senha'));
            $user ->cpf = $request->input('cpf');
            $user ->fotoPerfil = $request->input('fotoPerfil');
            $user ->dataCadastro = now();
            $user ->statusConta = "Ativa";

            $user->save();

            $adm->userId = $user->id;
            $adm->nivelAcesso = "Operador";

            $adm->save();

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
                'message' => 'Passageiro cadastrado com sucesso!',
                'passageiro' => $adm,
                'endereco' => $endereco,
                'telefone' => $telefone
            ], 201);

        }catch(\Exception $e){
            return response()->json([
                'message' => 'Erro ao cadastrar passageiro: ' . $e->getMessage()
            ], 500);
        }
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
