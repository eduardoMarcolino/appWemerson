<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/user/insert', [App\Http\Controllers\UserController::class, 'store']);

Route::post('/passageiro/insert', [App\Http\Controllers\PassageiroController::class, 'store']);

Route::post('/motorista/insert', [App\Http\Controllers\MotoristaController::class, 'store']);