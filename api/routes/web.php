<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminController;
use App\Http\Middleware\EnsureAdministrator;
use App\Http\Middleware\EnsureMasterAdministrator;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('admin.login');
});

Route::get('/admin/login', [AdminAuthController::class, 'create'])->name('admin.login');
Route::prefix('admin')->name('admin.')->middleware([
    EnsureAdministrator::class,
    EnsureMasterAdministrator::class,
])->group(function (): void {
    Route::get('/cadastro', [AdminAuthController::class, 'createRegistration'])->name('register');
    Route::post('/cadastro', [AdminAuthController::class, 'register'])
        ->middleware('throttle:3,1')
        ->name('register.store');
});
Route::post('/admin/login', [AdminAuthController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('admin.login.store');
Route::post('/admin/logout', [AdminAuthController::class, 'destroy'])->name('admin.logout');

Route::prefix('admin')->name('admin.')->middleware(EnsureAdministrator::class)->group(function (): void {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/eventos', [AdminController::class, 'events'])->name('events');
    Route::get('/eventos/criar', [AdminController::class, 'createEvent'])->name('events.create');
    Route::post('/eventos', [AdminController::class, 'storeEvent'])->name('events.store');
    Route::get('/eventos/{eventId}/editar', [AdminController::class, 'editEvent'])->whereNumber('eventId')->name('events.edit');
    Route::put('/eventos/{eventId}', [AdminController::class, 'updateEvent'])->whereNumber('eventId')->name('events.update');
    Route::patch('/eventos/{eventId}/status', [AdminController::class, 'toggleEvent'])->whereNumber('eventId')->name('events.toggle');

    Route::prefix('contas')->name('accounts.')->middleware(EnsureMasterAdministrator::class)->group(function (): void {
        Route::get('/', [AdminController::class, 'accounts'])->name('index');
        Route::get('/{userId}/editar', [AdminController::class, 'editAccount'])->whereNumber('userId')->name('edit');
        Route::put('/{userId}', [AdminController::class, 'updateAccount'])->whereNumber('userId')->name('update');
    });
});
