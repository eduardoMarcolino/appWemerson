<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MotoristaModel;
use App\Http\Controllers\UserController;

class MotoristaController extends Controller
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
         $userController = new UserController();
         $motorista = new MotoristaModel();

         try{
            $user = $userController->store($request);
            $motorista->userId = $user->id;
            $motorista->cnh = $request->cnh;
            $motorista->validadeCNH = $request->validadeCNH;
            $motorista->avaliacaoMedia = $request->avaliacaoMedia;
            $motorista->statusMotorista = "Pendente";

            $motorista->save();

            return response()->json([
                'message' => 'Motorista cadastrado com sucesso!',
                'motorista' => $motorista
            ], 201);
        }catch(\Exception $e){
            return response()->json([
                'message' => 'Erro ao cadastrar motorista: ' . $e->getMessage()
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
