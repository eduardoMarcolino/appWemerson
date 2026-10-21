<?php

use App\Models\UserModel;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function tokenTestPassengerCredentials(): array
{
    return [
        'nome' => 'Ana Token',
        'email' => 'ana.token@example.test',
        'senha' => 'senha-segura',
        'cpf' => '52998224725',
        'numeroTelefone' => '11999998888',
        'logradouro' => 'Rua de Teste',
    ];
}

function tokenTestCreatePassenger(): array
{
    $registration = test()->postJson('/api/passageiro/insert', tokenTestPassengerCredentials())->assertCreated();

    return [
        UserModel::where('email', 'ana.token@example.test')->firstOrFail(),
        $registration->json('token'),
    ];
}

it('issues expiring tokens and rotates them through the authenticated refresh endpoint', function () {
    [$user, $oldToken] = tokenTestCreatePassenger();

    expect($user->tokens()->first()->expires_at)->not->toBeNull();

    $refresh = $this->withToken($oldToken)
        ->postJson('/api/auth/refresh')
        ->assertOk()
        ->assertJsonStructure(['token', 'expires_at']);

    expect($refresh->json('token'))->not->toBe($oldToken);
    app('auth')->forgetGuards();
    $this->withToken($oldToken)->getJson('/api/session')->assertUnauthorized();
    app('auth')->forgetGuards();
    $this->withToken($refresh->json('token'))->getJson('/api/session')->assertOk();
});

it('rejects an expired token and cannot refresh it', function () {
    [$user] = tokenTestCreatePassenger();
    $expiredToken = $user->createToken('expired-test', ['*'], now()->subMinute())->plainTextToken;

    $this->withToken($expiredToken)->getJson('/api/session')->assertUnauthorized();
    $this->withToken($expiredToken)->postJson('/api/auth/refresh')->assertUnauthorized();
});

it('revokes the current token on logout and protects authenticated routes', function () {
    [$user, $token] = tokenTestCreatePassenger();

    $this->getJson('/api/session')->assertUnauthorized();
    $this->withToken('invalid-token')->getJson('/api/session')->assertUnauthorized();
    app('auth')->forgetGuards();
    $this->withToken($token)->postJson('/api/logout')->assertOk();
    app('auth')->forgetGuards();
    $this->withToken($token)->getJson('/api/session')->assertUnauthorized();
});
