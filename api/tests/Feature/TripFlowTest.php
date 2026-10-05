<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function resetApiAuth(): void
{
    app('auth')->forgetGuards();
}

function passengerCredentials(): array
{
    return [
        'nome' => 'Ana Teste',
        'email' => 'ana.teste@example.test',
        'senha' => 'senha-segura',
        'cpf' => '12345678901',
        'numeroTelefone' => '11999998888',
        'logradouro' => 'Rua de Teste',
        'numero' => '10',
        'bairro' => 'Centro',
        'cidade' => 'São Paulo',
        'estado' => 'SP',
        'cep' => '01000000',
    ];
}

function driverCredentials(): array
{
    return [
        'nome' => 'Carlos Teste',
        'email' => 'carlos.teste@example.test',
        'senha' => 'senha-segura',
        'cpf' => '98765432100',
        'numeroTelefone' => '11988887777',
        'logradouro' => 'Rua do Motorista',
        'cidade' => 'São Paulo',
        'estado' => 'SP',
        'cnh' => 'CNH123456',
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

it('supports an authenticated passenger and driver ride from request through payment and reviews', function () {
    $passengerRegistration = $this->postJson('/api/passageiro/insert', passengerCredentials())
        ->assertCreated();
    expect(array_key_exists('senha', $passengerRegistration->json('user')))->toBeFalse();
    $driverRegistration = $this->postJson('/api/motorista/insert', driverCredentials())
        ->assertCreated();
    $passengerResponse = $this->postJson('/api/loginPassageiro', [
        'email' => passengerCredentials()['email'],
        'senha' => passengerCredentials()['senha'],
    ])->assertOk();
    $driverResponse = $this->postJson('/api/loginMotorista', [
        'email' => driverCredentials()['email'],
        'senha' => driverCredentials()['senha'],
    ])->assertOk();

    $passengerHeaders = ['Authorization' => 'Bearer '.$passengerResponse->json('token')];
    $driverHeaders = ['Authorization' => 'Bearer '.$driverResponse->json('token')];

    $this->getJson('/api/motorista/corridas/ofertas', $driverHeaders)
        ->assertOk()
        ->assertExactJson([]);

    resetApiAuth();
    $request = $this->postJson('/api/corridas', [
        'origem' => 'Praça da Matriz',
        'latitudeOrigem' => -23.5505,
        'longitudeOrigem' => -46.6333,
        'destino' => 'Shopping Jardins',
        'latitudeDestino' => -23.5614,
        'longitudeDestino' => -46.6559,
        'categoria' => 'Economico',
        'beneficiarioNome' => null,
    ], $passengerHeaders)->assertCreated();
    $rideId = $request->json('corrida.corrida.corridaId');
    expect($request->json('corrida.corrida.distanciaKm'))->toBeGreaterThan(0);

    resetApiAuth();
    $this->getJson('/api/motorista/corridas/ofertas', $driverHeaders)
        ->assertOk()
        ->assertJsonPath('0.corrida.corridaId', $rideId);

    $this->postJson("/api/corridas/{$rideId}/aceitar", [], $driverHeaders)
        ->assertOk()
        ->assertJsonPath('corrida.corrida.status', 'Aceita');
    $this->postJson("/api/corridas/{$rideId}/aceitar", [], $driverHeaders)
        ->assertStatus(409);

    $this->postJson("/api/corridas/{$rideId}/cheguei", [], $driverHeaders)
        ->assertOk()
        ->assertJsonPath('corrida.corrida.status', 'MotoristaChegando');
    $this->postJson("/api/corridas/{$rideId}/iniciar", [], $driverHeaders)
        ->assertOk()
        ->assertJsonPath('corrida.corrida.status', 'EmAndamento');
    $this->postJson("/api/corridas/{$rideId}/localizacao", [
        'latitude' => -23.555,
        'longitude' => -46.644,
    ], $driverHeaders)->assertCreated();

    resetApiAuth();
    $this->getJson("/api/corridas/{$rideId}", $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('localizacao.latitude', -23.555);

    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/finalizar", [], $driverHeaders)
        ->assertOk()
        ->assertJsonPath('corrida.corrida.status', 'Finalizada');
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/pagamento", [
        'formaPagamento' => 'Pix',
    ], $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('testOnly', true)
        ->assertJsonPath('pagamento.statusPagamento', 'Pago');
    $this->postJson("/api/corridas/{$rideId}/avaliacoes", [
        'nota' => 5,
        'comentario' => 'Ótimo atendimento.',
    ], $passengerHeaders)->assertCreated();
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/avaliacoes", [
        'nota' => 5,
    ], $driverHeaders)->assertCreated();

    resetApiAuth();
    $this->getJson('/api/passageiro/corridas', $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('0.corrida.status', 'Finalizada')
        ->assertJsonPath('0.pagamento.statusPagamento', 'Pago');
});

it('rejects unauthenticated access and invalid trip input', function () {
    $this->getJson('/api/motorista/corridas/ofertas')->assertUnauthorized();
    resetApiAuth();

    $passenger = $this->postJson('/api/passageiro/insert', passengerCredentials())->assertCreated();
    $headers = ['Authorization' => 'Bearer '.$passenger->json('token')];

    $this->postJson('/api/corridas', [
        'origem' => 'Praça da Matriz',
        'latitudeOrigem' => 120,
        'longitudeOrigem' => -46.6333,
        'destino' => 'Shopping Jardins',
        'latitudeDestino' => -23.5614,
        'longitudeDestino' => -46.6559,
        'categoria' => 'Economico',
    ], $headers)->assertUnprocessable();
});

it('keeps future rides in the scheduled driver feed and assigns them only once accepted', function () {
    $passenger = $this->postJson('/api/passageiro/insert', passengerCredentials())->assertCreated();
    $driver = $this->postJson('/api/motorista/insert', driverCredentials())->assertCreated();
    $passengerHeaders = ['Authorization' => 'Bearer '.$passenger->json('token')];
    $driverHeaders = ['Authorization' => 'Bearer '.$driver->json('token')];

    $ride = $this->postJson('/api/corridas', [
        'origem' => 'Praça da Matriz',
        'latitudeOrigem' => -23.5505,
        'longitudeOrigem' => -46.6333,
        'destino' => 'Rodoviária',
        'latitudeDestino' => -23.535,
        'longitudeDestino' => -46.6312,
        'categoria' => 'Economico',
        'dataHora' => now()->addDay()->toIso8601String(),
    ], $passengerHeaders)->assertCreated();
    $rideId = $ride->json('corrida.corrida.corridaId');

    resetApiAuth();
    $this->getJson('/api/motorista/corridas/ofertas', $driverHeaders)
        ->assertOk()
        ->assertExactJson([]);
    $this->getJson('/api/motorista/corridas/agendadas', $driverHeaders)
        ->assertOk()
        ->assertJsonPath('0.corrida.corridaId', $rideId)
        ->assertJsonPath('0.agendamento.status', 'Agendada');

    $this->postJson("/api/corridas/{$rideId}/aceitar", [], $driverHeaders)
        ->assertOk()
        ->assertJsonPath('corrida.corrida.status', 'Aceita')
        ->assertJsonPath('corrida.agendamento.status', 'Confirmada');
    $this->postJson("/api/corridas/{$rideId}/cheguei", [], $driverHeaders)->assertOk();
    $this->postJson("/api/corridas/{$rideId}/iniciar", [], $driverHeaders)
        ->assertStatus(409);
});
