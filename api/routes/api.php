<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/user/insert', [App\Http\Controllers\UserController::class, 'store']);

//cadastro de passageiro + user
Route::post('/passageiro/insert', [App\Http\Controllers\PassageiroController::class, 'cadastro']);
//select dos passageiros
Route::get('/passageiros', [App\Http\Controllers\PassageiroController::class, 'index']);
//login de passageiro
Route::post('/loginPassageiro', [App\Http\Controllers\PassageiroController::class, 'login']);

//cadastro de motorista + user
Route::post('/motorista/insert', [App\Http\Controllers\MotoristaController::class, 'cadastro']);
//select dos motoristas
Route::get('/motoristas', [App\Http\Controllers\MotoristaController::class, 'index']);
//login de motorista
Route::post('/loginMotorista', [App\Http\Controllers\MotoristaController::class, 'login']);

//cadastro de adm + user
Route::post('/adm/insert', [App\Http\Controllers\admController::class, 'cadastro']);
Route::get('/adms', [App\Http\Controllers\admController::class, 'index']);