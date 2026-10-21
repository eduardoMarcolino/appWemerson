<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AppDataController;
use App\Http\Controllers\CorridaController;
use App\Http\Controllers\MotoristaController;
use App\Http\Controllers\PassageiroController;
use App\Http\Controllers\PasswordRecoveryController;
use App\Http\Controllers\PushTokenController;
use App\Http\Controllers\SessionController;
use App\Http\Resources\UserSummaryResource;
use App\Support\RideCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/passageiro/insert', [PassageiroController::class, 'cadastro'])
    ->middleware('throttle:3,1');
Route::post('/loginPassageiro', [PassageiroController::class, 'login'])
    ->middleware('throttle:5,1');
Route::post('/motorista/insert', [MotoristaController::class, 'cadastro'])
    ->middleware('throttle:3,1');
Route::post('/loginMotorista', [MotoristaController::class, 'login'])
    ->middleware('throttle:5,1');
Route::post('/password/forgot', [PasswordRecoveryController::class, 'sendCode'])
    ->middleware('throttle:3,1');
Route::post('/password/reset', [PasswordRecoveryController::class, 'reset'])
    ->middleware('throttle:5,1');
Route::get('/catalogos', fn () => response()->json([
    'categorias' => RideCatalog::categories(),
    'formasPagamento' => RideCatalog::paymentMethods(),
]));

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/user', fn (Request $request) => UserSummaryResource::make($request->user())->resolve($request));
    Route::get('/session', [SessionController::class, 'show']);
    Route::post('/auth/refresh', [SessionController::class, 'refresh']);
    Route::put('/account', [AccountController::class, 'update']);
    Route::post('/account/photo', [AccountController::class, 'updatePhoto']);
    Route::delete('/account', [AccountController::class, 'deactivate']);
    Route::post('/notifications/token', [PushTokenController::class, 'register']);
    Route::delete('/notifications/token', [PushTokenController::class, 'unregister']);
    Route::get('/app-data', [AppDataController::class, 'index']);
    Route::post('/passageiro/enderecos-favoritos', [AppDataController::class, 'saveFavoriteAddress']);
    Route::delete('/passageiro/enderecos-favoritos/{id}', [AppDataController::class, 'deleteFavoriteAddress']);
    Route::post('/passageiro/motoristas-favoritos/{id}', [AppDataController::class, 'saveFavoriteDriver']);
    Route::delete('/passageiro/motoristas-favoritos/{id}', [AppDataController::class, 'deleteFavoriteDriver']);
    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sessão encerrada.']);
    });

    Route::get('/passageiro/corridas', [CorridaController::class, 'passageiroIndex']);
    Route::get('/motorista/corridas', [CorridaController::class, 'motoristaIndex']);
    Route::get('/motorista/corridas/ofertas', [CorridaController::class, 'ofertas']);
    Route::get('/motorista/corridas/agendadas', [CorridaController::class, 'agendadas']);

    Route::post('/corridas', [CorridaController::class, 'store']);
    Route::get('/corridas/ativa', [CorridaController::class, 'ativa']);
    Route::get('/corridas/{corrida}', [CorridaController::class, 'show']);
    Route::post('/corridas/{corrida}/aceitar', [CorridaController::class, 'aceitar']);
    Route::post('/corridas/{corrida}/recusar', [CorridaController::class, 'recusar']);
    Route::post('/corridas/{corrida}/cheguei', [CorridaController::class, 'chegou']);
    Route::post('/corridas/{corrida}/iniciar', [CorridaController::class, 'iniciar']);
    Route::post('/corridas/{corrida}/finalizar', [CorridaController::class, 'finalizar']);
    Route::post('/corridas/{corrida}/cancelar', [CorridaController::class, 'cancelar']);
    Route::get('/corridas/{corrida}/incidentes', [CorridaController::class, 'incidentes']);
    Route::post('/corridas/{corrida}/incidentes', [CorridaController::class, 'registrarIncidente']);
    Route::post('/corridas/{corrida}/pagamento', [CorridaController::class, 'pagar']);
    Route::post('/corridas/{corrida}/avaliacoes', [CorridaController::class, 'avaliar']);
    Route::post('/corridas/{corrida}/denuncias', [CorridaController::class, 'denunciar']);
    Route::get('/denuncias/recebidas', [CorridaController::class, 'denunciasRecebidas']);
    Route::post('/corridas/{corrida}/localizacao', [CorridaController::class, 'localizar']);
});
