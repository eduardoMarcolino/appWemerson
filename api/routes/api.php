<?php

use App\Http\Controllers\CorridaController;
use App\Http\Controllers\MotoristaController;
use App\Http\Controllers\PassageiroController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/passageiro/insert', [PassageiroController::class, 'cadastro']);
Route::post('/loginPassageiro', [PassageiroController::class, 'login']);
Route::post('/motorista/insert', [MotoristaController::class, 'cadastro']);
Route::post('/loginMotorista', [MotoristaController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sessão encerrada.']);
    });

    Route::get('/passageiro/corridas', [CorridaController::class, 'passageiroIndex']);
    Route::get('/motorista/corridas', [CorridaController::class, 'motoristaIndex']);
    Route::get('/motorista/corridas/ofertas', [CorridaController::class, 'ofertas']);
    Route::get('/motorista/corridas/agendadas', [CorridaController::class, 'agendadas']);

    Route::post('/corridas', [CorridaController::class, 'store']);
    Route::get('/corridas/{corrida}', [CorridaController::class, 'show']);
    Route::post('/corridas/{corrida}/aceitar', [CorridaController::class, 'aceitar']);
    Route::post('/corridas/{corrida}/cheguei', [CorridaController::class, 'chegou']);
    Route::post('/corridas/{corrida}/iniciar', [CorridaController::class, 'iniciar']);
    Route::post('/corridas/{corrida}/finalizar', [CorridaController::class, 'finalizar']);
    Route::post('/corridas/{corrida}/cancelar', [CorridaController::class, 'cancelar']);
    Route::post('/corridas/{corrida}/pagamento', [CorridaController::class, 'pagar']);
    Route::post('/corridas/{corrida}/avaliacoes', [CorridaController::class, 'avaliar']);
    Route::post('/corridas/{corrida}/localizacao', [CorridaController::class, 'localizar']);
});
