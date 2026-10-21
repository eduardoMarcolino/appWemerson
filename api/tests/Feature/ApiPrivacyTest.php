<?php

use App\Models\MotoristaModel;
use App\Models\UserModel;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function privacyPassengerData(): array
{
    return [
        'nome' => 'Ana Privacidade',
        'email' => 'ana.privacidade@example.test',
        'senha' => 'senha-segura',
        'cpf' => '52998224725',
        'numeroTelefone' => '11999998888',
        'logradouro' => 'Rua Protegida',
        'cidade' => 'São Paulo',
        'estado' => 'SP',
    ];
}

function privacyDriverData(): array
{
    return [
        'nome' => 'Carlos Privacidade',
        'email' => 'carlos.privacidade@example.test',
        'senha' => 'senha-segura',
        'cpf' => '98765432100',
        'numeroTelefone' => '11988887777',
        'logradouro' => 'Rua Segura',
        'cidade' => 'São Paulo',
        'estado' => 'SP',
        'cnh' => '12345678900',
        'validadeCNH' => now()->addYear()->toDateString(),
        'marca' => 'Chevrolet',
        'modelo' => 'Onix',
        'placa' => 'ABC1D23',
        'cor' => 'Prata',
        'anoFabricacao' => 2023,
        'anoModelo' => 2024,
        'categoria' => 'Economico',
    ];
}

it('returns minimal identity details publicly and keeps account data on the owner session', function () {
    $registration = $this->postJson('/api/passageiro/insert', privacyPassengerData())->assertCreated();
    expect($registration->json('user'))->toHaveKeys(['userId', 'nome', 'email', 'fotoPerfil'])
        ->and($registration->json('user'))->not->toHaveKey('cpf');

    $login = $this->postJson('/api/loginPassageiro', [
        'email' => privacyPassengerData()['email'],
        'senha' => privacyPassengerData()['senha'],
    ])->assertOk();
    expect($login->json('user'))->not->toHaveKey('cpf');

    $this->withToken($login->json('token'))
        ->getJson('/api/session')
        ->assertOk()
        ->assertJsonPath('user.cpf', privacyPassengerData()['cpf'])
        ->assertJsonMissingPath('user.senha');
});

it('hides driver identity and beneficiary secrets from ride and favorite-driver payloads', function () {
    $this->postJson('/api/passageiro/insert', privacyPassengerData())->assertCreated();
    $this->postJson('/api/motorista/insert', privacyDriverData())->assertCreated();

    $passengerLogin = $this->postJson('/api/loginPassageiro', [
        'email' => privacyPassengerData()['email'],
        'senha' => privacyPassengerData()['senha'],
    ])->assertOk();
    $driverLogin = $this->postJson('/api/loginMotorista', [
        'email' => privacyDriverData()['email'],
        'senha' => privacyDriverData()['senha'],
    ])->assertOk();
    $passengerHeaders = ['Authorization' => 'Bearer '.$passengerLogin->json('token')];
    $driverHeaders = ['Authorization' => 'Bearer '.$driverLogin->json('token')];

    $request = $this->postJson('/api/corridas', [
        'origem' => 'Praça da Matriz',
        'latitudeOrigem' => -23.5505,
        'longitudeOrigem' => -46.6333,
        'destino' => 'Terminal',
        'latitudeDestino' => -23.5614,
        'longitudeDestino' => -46.6559,
        'categoria' => 'Economico',
        'beneficiarioNome' => 'Pessoa Beneficiária',
        'beneficiarioTelefone' => '11977776666',
        'tokenCompartilhamento' => 'segredo-de-compartilhamento',
    ], $passengerHeaders)->assertCreated();
    $rideId = $request->json('corrida.corrida.corridaId');

    app('auth')->forgetGuards();
    $this->postJson("/api/corridas/{$rideId}/aceitar", [], $driverHeaders)->assertOk();
    app('auth')->forgetGuards();
    $rideResponse = $this->getJson("/api/corridas/{$rideId}", $passengerHeaders)->assertOk();
    $rideResponse->assertJsonPath('motorista.user.nome', privacyDriverData()['nome'])
        ->assertJsonPath('motorista.veiculos.0.marca', 'Chevrolet')
        ->assertJsonPath('motorista.veiculos.0.placa', 'ABC1D23')
        ->assertJsonMissingPath('motorista.cnh')
        ->assertJsonMissingPath('motorista.user.email')
        ->assertJsonMissingPath('motorista.user.cpf')
        ->assertJsonMissingPath('corrida.beneficiarioTelefone')
        ->assertJsonMissingPath('corrida.tokenCompartilhamento');

    $driver = MotoristaModel::where('userId', UserModel::where('email', privacyDriverData()['email'])->value('userId'))->firstOrFail();
    $this->postJson("/api/passageiro/motoristas-favoritos/{$driver->motoristaId}", [], $passengerHeaders)->assertCreated();
    app('auth')->forgetGuards();
    $this->getJson('/api/app-data', $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('motoristasFavoritos.0.user.nome', privacyDriverData()['nome'])
        ->assertJsonMissingPath('motoristasFavoritos.0.cnh')
        ->assertJsonMissingPath('motoristasFavoritos.0.user.email')
        ->assertJsonMissingPath('motoristasFavoritos.0.user.cpf');
});
