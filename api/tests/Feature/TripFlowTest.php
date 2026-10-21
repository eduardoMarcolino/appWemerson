<?php

use App\Models\admModel;
use App\Models\PassageiroModel;
use App\Models\UserModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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
        'cpf' => '52998224725',
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

it('serves the categories and payment methods available to the apps', function () {
    $this->getJson('/api/catalogos')
        ->assertOk()
        ->assertJsonPath('categorias.0.value', 'Economico')
        ->assertJsonPath('categorias.0.label', 'Econômico')
        ->assertJsonPath('formasPagamento.0.value', 'Pix')
        ->assertJsonPath('formasPagamento.0.label', 'Pix');
});

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
    $this->getJson('/api/corridas/ativa', $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('activeRide.corrida.corridaId', $rideId)
        ->assertJsonPath('activeRide.corrida.status', 'Solicitada');

    resetApiAuth();
    $this->getJson('/api/corridas/ativa', $driverHeaders)
        ->assertOk()
        ->assertJsonPath('activeRide', null);
    $this->getJson('/api/motorista/corridas/ofertas', $driverHeaders)
        ->assertOk()
        ->assertJsonPath('0.corrida.corridaId', $rideId);

    $this->postJson("/api/corridas/{$rideId}/aceitar", [], $driverHeaders)
        ->assertOk()
        ->assertJsonPath('corrida.corrida.status', 'Aceita');
    resetApiAuth();
    $this->getJson('/api/corridas/ativa', $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('activeRide.corrida.status', 'Aceita');
    resetApiAuth();
    $this->getJson('/api/corridas/ativa', $driverHeaders)
        ->assertOk()
        ->assertJsonPath('activeRide.corrida.status', 'Aceita');
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/aceitar", [], $driverHeaders)
        ->assertStatus(409);

    $this->postJson("/api/corridas/{$rideId}/cheguei", [], $driverHeaders)
        ->assertOk()
        ->assertJsonPath('corrida.corrida.status', 'MotoristaChegando');
    $this->postJson("/api/corridas/{$rideId}/iniciar", [], $driverHeaders)
        ->assertOk()
        ->assertJsonPath('corrida.corrida.status', 'EmAndamento');
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/incidentes", [
        'categoria' => 'Veiculo',
        'descricao' => 'Pneu com baixa pressão.',
    ], $passengerHeaders)->assertCreated()->assertJsonPath('incidente.reportadoPor', 'Passageiro');
    resetApiAuth();
    $this->getJson("/api/corridas/{$rideId}/incidentes", $driverHeaders)
        ->assertOk()->assertJsonPath('incidentes.0.descricao', 'Pneu com baixa pressão.');
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/incidentes", [
        'categoria' => 'Rota',
        'descricao' => 'Desvio inesperado.',
    ], $passengerHeaders)->assertCreated();
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/localizacao", [
        'latitude' => -23.555,
        'longitude' => -46.644,
    ], $driverHeaders)->assertCreated();

    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/localizacao", [
        'latitude' => -23.556,
        'longitude' => -46.645,
    ], $passengerHeaders)->assertCreated()->assertJsonPath('tipo', 'Passageiro');

    resetApiAuth();
    $this->getJson('/api/corridas/ativa', $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('activeRide.corrida.status', 'EmAndamento');
    resetApiAuth();
    $this->getJson('/api/corridas/ativa', $driverHeaders)
        ->assertOk()
        ->assertJsonPath('activeRide.corrida.status', 'EmAndamento');
    resetApiAuth();
    $this->getJson("/api/corridas/{$rideId}", $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('localizacao.latitude', -23.555)
        ->assertJsonPath('localizacaoMotorista.latitude', -23.555)
        ->assertJsonPath('localizacaoPassageiro.latitude', -23.556);

    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/finalizar", [], $driverHeaders)
        ->assertOk()
        ->assertJsonPath('corrida.corrida.status', 'Finalizada');
    resetApiAuth();
    $this->getJson('/api/corridas/ativa', $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('activeRide', null);
    resetApiAuth();
    $this->getJson('/api/corridas/ativa', $driverHeaders)
        ->assertOk()
        ->assertJsonPath('activeRide', null);
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/avaliacoes", [
        'nota' => 5,
        'comentario' => 'Ótimo atendimento.',
    ], $passengerHeaders)->assertCreated();
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/avaliacoes", [
        'nota' => 4,
    ], $passengerHeaders)->assertStatus(409);
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/avaliacoes", [
        'nota' => 5,
    ], $driverHeaders)->assertCreated();
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/denuncias", [
        'motivo' => 'Conduta',
        'descricao' => 'Exemplo para validar o fluxo.',
    ], $passengerHeaders)->assertCreated();
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/denuncias", [
        'motivo' => 'Outro',
    ], $passengerHeaders)->assertStatus(409);
    resetApiAuth();
    $this->getJson('/api/denuncias/recebidas', $driverHeaders)
        ->assertOk()->assertJsonPath('denuncias.0.motivo', 'Conduta');
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/denuncias", [
        'motivo' => 'Seguranca',
    ], $driverHeaders)->assertCreated();
    resetApiAuth();
    $this->getJson('/api/denuncias/recebidas', $passengerHeaders)
        ->assertOk()->assertJsonPath('denuncias.0.reportadoPor', 'Motorista');
    resetApiAuth();
    $this->postJson("/api/corridas/{$rideId}/pagamento", [
        'formaPagamento' => 'Pix',
    ], $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('testOnly', true)
        ->assertJsonPath('pagamento.statusPagamento', 'Pago');
    resetApiAuth();
    $this->getJson('/api/passageiro/corridas', $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('0.corrida.status', 'Finalizada')
        ->assertJsonPath('0.pagamento.statusPagamento', 'Pago');
    resetApiAuth();
    $this->getJson('/api/app-data', $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('perfil.avaliacaoMedia', 5)
        ->assertJsonPath('perfil.totalAvaliacoes', 1)
        ->assertJsonPath('pagamentos.0.corrida.corridaId', $rideId)
        ->assertJsonPath('pagamentos.0.pagamento.statusPagamento', 'Pago');

    resetApiAuth();
    $secondRide = $this->postJson('/api/corridas', [
        'origem' => 'Praça da Matriz',
        'latitudeOrigem' => -23.5505,
        'longitudeOrigem' => -46.6333,
        'destino' => 'Rodoviária',
        'latitudeDestino' => -23.535,
        'longitudeDestino' => -46.6312,
        'categoria' => 'Economico',
    ], $passengerHeaders)->assertCreated();
    $cancelledRideId = $secondRide->json('corrida.corrida.corridaId');
    $this->postJson("/api/corridas/{$cancelledRideId}/cancelar", [], $passengerHeaders)
        ->assertStatus(422);
    $this->postJson("/api/corridas/{$cancelledRideId}/cancelar", [
        'motivoCancelamento' => 'Mudança de planos.',
    ], $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('corrida.corrida.status', 'Cancelada')
        ->assertJsonPath('corrida.corrida.motivoCancelamento', 'Mudança de planos.');
    $this->getJson('/api/corridas/ativa', $passengerHeaders)
        ->assertOk()
        ->assertJsonPath('activeRide', null);
});

it('lets a driver decline an offer without withdrawing it from other drivers', function () {
    $passenger = $this->postJson('/api/passageiro/insert', passengerCredentials())->assertCreated();
    $driverOne = $this->postJson('/api/motorista/insert', driverCredentials())->assertCreated();

    $driverTwoData = driverCredentials();
    $driverTwoData['nome'] = 'Carlos Segundo';
    $driverTwoData['email'] = 'carlos.segundo@example.test';
    $driverTwoData['cpf'] = '11144477735';
    $driverTwoData['placa'] = 'XYZ9Z99';
    $driverTwo = $this->postJson('/api/motorista/insert', $driverTwoData)->assertCreated();
    DB::table('tbMotorista')->where('motoristaId', $driverOne->json('motorista.motoristaId'))->update(['statusMotorista' => 'Aprovado']);
    DB::table('tbMotorista')->where('motoristaId', $driverTwo->json('motorista.motoristaId'))->update(['statusMotorista' => 'Aprovado']);

    $ride = $this->postJson('/api/corridas', [
        'origem' => 'Praça da Matriz', 'latitudeOrigem' => -23.5505, 'longitudeOrigem' => -46.6333,
        'destino' => 'Rodoviária', 'latitudeDestino' => -23.535, 'longitudeDestino' => -46.6312,
        'categoria' => 'Economico',
    ], ['Authorization' => 'Bearer '.$passenger->json('token')])->assertCreated();
    $rideId = $ride->json('corrida.corrida.corridaId');

    $this->postJson("/api/corridas/{$rideId}/recusar", [], ['Authorization' => 'Bearer '.$driverOne->json('token')])
        ->assertOk()
        ->assertJsonPath('message', 'Solicitação recusada. Ela continuará disponível para outros motoristas.');
    $this->getJson('/api/motorista/corridas/ofertas', ['Authorization' => 'Bearer '.$driverOne->json('token')])
        ->assertOk()->assertExactJson([]);
    $this->getJson('/api/motorista/corridas/ofertas', ['Authorization' => 'Bearer '.$driverTwo->json('token')])
        ->assertOk()->assertJsonPath('0.corrida.corridaId', $rideId);
    expect(DB::table('tbCorrida')->where('corridaId', $rideId)->value('status'))->toBe('Solicitada');

    $this->postJson('/api/corridas', [
        'origem' => 'Praça da Matriz', 'latitudeOrigem' => -23.5505, 'longitudeOrigem' => -46.6333,
        'destino' => 'Shopping Jardins', 'latitudeDestino' => -23.5614, 'longitudeDestino' => -46.6559,
        'categoria' => 'Economico',
    ], ['Authorization' => 'Bearer '.$passenger->json('token')])->assertStatus(409);
});

it('creates a scheduled ride, exposes it to drivers, and synchronizes acceptance', function () {
    $passenger = $this->postJson('/api/passageiro/insert', passengerCredentials())->assertCreated();
    $driver = $this->postJson('/api/motorista/insert', driverCredentials())->assertCreated();
    DB::table('tbMotorista')->where('motoristaId', $driver->json('motorista.motoristaId'))->update(['statusMotorista' => 'Aprovado']);
    $passengerHeaders = ['Authorization' => 'Bearer '.$passenger->json('token')];
    $driverHeaders = ['Authorization' => 'Bearer '.$driver->json('token')];

    $request = $this->postJson('/api/corridas', [
        'origem' => 'Praça da Matriz', 'latitudeOrigem' => -23.5505, 'longitudeOrigem' => -46.6333,
        'destino' => 'Rodoviária', 'latitudeDestino' => -23.535, 'longitudeDestino' => -46.6312,
        'categoria' => 'Economico', 'dataHora' => now()->addHour()->toIso8601String(),
    ], $passengerHeaders)->assertCreated()
        ->assertJsonPath('message', 'Corrida agendada.')
        ->assertJsonPath('corrida.corrida.status', 'Solicitada')
        ->assertJsonPath('corrida.agendamento.status', 'Agendada');
    $rideId = $request->json('corrida.corrida.corridaId');

    $this->getJson('/api/motorista/corridas/agendadas', $driverHeaders)
        ->assertOk()->assertJsonPath('0.corrida.corridaId', $rideId);
    $this->getJson('/api/motorista/corridas/ofertas', $driverHeaders)->assertOk()->assertExactJson([]);
    $this->postJson("/api/corridas/{$rideId}/aceitar", [], $driverHeaders)
        ->assertOk()->assertJsonPath('corrida.agendamento.status', 'Confirmada');
    $this->getJson('/api/corridas/ativa', $passengerHeaders)
        ->assertOk()->assertJsonPath('activeRide.corrida.status', 'Aceita');
    $this->getJson('/api/corridas/ativa', $driverHeaders)
        ->assertOk()->assertJsonPath('activeRide.corrida.status', 'Aceita');
});

it('rejects unauthenticated access and invalid trip input', function () {
    $this->getJson('/api/motorista/corridas/ofertas')->assertUnauthorized();
    $this->getJson('/api/corridas/ativa')->assertUnauthorized();
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

it('requires an eleven digit CNH and keeps local driver registrations pending review', function () {
    $this->app->detectEnvironment(fn (): string => 'local');
    $invalidDriver = driverCredentials();
    $invalidDriver['cnh'] = 'CNH123456';

    $this->postJson('/api/motorista/insert', $invalidDriver)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('cnh');

    $validDriver = $this->postJson('/api/motorista/insert', driverCredentials())->assertCreated();

    $duplicateDriver = driverCredentials();
    $duplicateDriver['email'] = 'outro.motorista@example.test';
    $duplicateDriver['cpf'] = '11144477735';
    $duplicateDriver['placa'] = 'DEF4G56';
    $this->postJson('/api/motorista/insert', $duplicateDriver)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('cnh');

    expect($validDriver->json('motorista.statusMotorista'))->toBe('Pendente');
});

it('restores only active accounts and serves user data for the app cache', function () {
    $registration = $this->postJson('/api/passageiro/insert', passengerCredentials())->assertCreated();
    $headers = ['Authorization' => 'Bearer '.$registration->json('token')];

    $this->getJson('/api/session', $headers)
        ->assertOk()
        ->assertJsonPath('user.userId', $registration->json('user.userId'))
        ->assertJsonPath('passageiro.status', 'Ativo');

    resetApiAuth();
    $this->getJson('/api/app-data', $headers)
        ->assertOk()
        ->assertJsonStructure([
            'perfil' => ['telefones', 'enderecos'],
            'eventos',
            'pontosInteresse',
            'pontosEmbarque',
            'pontosEncontro',
            'enderecosFavoritos',
            'motoristasFavoritos',
            'pagamentos',
            'desempenho',
        ]);

    $driver = $this->postJson('/api/motorista/insert', driverCredentials())->assertCreated();
    resetApiAuth();
    $address = $this->postJson('/api/passageiro/enderecos-favoritos', [
        'nome' => 'Casa',
        'endereco' => 'Rua de Teste, 10',
        'tipo' => 'Casa',
    ], $headers)->assertCreated();

    resetApiAuth();
    $this->postJson('/api/passageiro/motoristas-favoritos/'.$driver->json('motorista.motoristaId'), [], $headers)
        ->assertCreated();

    resetApiAuth();
    $this->getJson('/api/app-data', $headers)
        ->assertOk()
        ->assertJsonPath('enderecosFavoritos.0.nome', 'Casa')
        ->assertJsonPath('motoristasFavoritos.0.motoristaId', $driver->json('motorista.motoristaId'));

    resetApiAuth();
    $this->deleteJson('/api/passageiro/enderecos-favoritos/'.$address->json('enderecoFavoritoId'), [], $headers)
        ->assertOk();
    resetApiAuth();
    $this->deleteJson('/api/passageiro/motoristas-favoritos/'.$driver->json('motorista.motoristaId'), [], $headers)
        ->assertOk();

    resetApiAuth();
    PassageiroModel::where('userId', $registration->json('user.userId'))
        ->update(['status' => 'Inativo']);
    $this->getJson('/api/session', $headers)->assertForbidden();

    $deletedAccount = passengerCredentials();
    $deletedAccount['email'] = 'deleted@example.test';
    $deletedAccount['cpf'] = '11144477735';
    $deleted = $this->postJson('/api/passageiro/insert', $deletedAccount)->assertCreated();
    $deletedHeaders = ['Authorization' => 'Bearer '.$deleted->json('token')];
    resetApiAuth();
    UserModel::whereKey($deleted->json('user.userId'))->delete();
    $this->getJson('/api/session', $deletedHeaders)->assertUnauthorized();
});

it('lets a passenger edit their account and deactivate it with password confirmation', function () {
    $registration = $this->postJson('/api/passageiro/insert', passengerCredentials())->assertCreated();
    $headers = ['Authorization' => 'Bearer '.$registration->json('token')];
    $userId = $registration->json('user.userId');

    $this->putJson('/api/account', [
        'nome' => 'Ana Editada',
        'email' => 'ana.editada@example.test',
        'cpf' => '52998224725',
        'numeroTelefone' => '11977776666',
        'logradouro' => 'Avenida Nova',
        'numero' => '25',
        'complemento' => 'Bloco B',
        'bairro' => 'Jardim',
        'cidade' => 'Campinas',
        'estado' => 'SP',
        'cep' => '13000000',
        'senhaAtual' => passengerCredentials()['senha'],
        'novaSenha' => 'senha-nova-segura',
        'novaSenha_confirmation' => 'senha-nova-segura',
    ], $headers)
        ->assertOk()
        ->assertJsonPath('user.nome', 'Ana Editada')
        ->assertJsonPath('telefones.0.numeroTelefone', '11977776666')
        ->assertJsonPath('enderecos.0.logradouro', 'Avenida Nova');

    expect(UserModel::findOrFail($userId)->tokens()->count())->toBe(1);

    $this->deleteJson('/api/account', ['senhaAtual' => 'senha-incorreta'], $headers)->assertUnprocessable();
    $this->deleteJson('/api/account', ['senhaAtual' => 'senha-nova-segura'], $headers)
        ->assertOk()
        ->assertJsonPath('message', 'Conta excluída. Dados pessoais foram removidos ou pseudonimizados; alguns dados operacionais das corridas foram preservados.');
    expect(UserModel::findOrFail($userId)->statusConta)->toBe('Inativa')
        ->and(UserModel::findOrFail($userId)->nome)->toBe('Conta removida')
        ->and(UserModel::findOrFail($userId)->email)->toBe('removida-'.$userId.'@interiorgo.invalid')
        ->and(PassageiroModel::where('userId', $userId)->value('status'))->toBe('Inativo')
        ->and(UserModel::findOrFail($userId)->tokens()->count())->toBe(0);

    resetApiAuth();
    $this->postJson('/api/loginPassageiro', [
        'email' => 'ana.editada@example.test',
        'senha' => 'senha-nova-segura',
    ])->assertUnprocessable();
});

it('refuses account deletion while the passenger has an active ride', function () {
    $registration = $this->postJson('/api/passageiro/insert', passengerCredentials())->assertCreated();
    $headers = ['Authorization' => 'Bearer '.$registration->json('token')];
    $passengerId = PassageiroModel::where('userId', $registration->json('user.userId'))->value('passageiroId');

    DB::table('tbCorrida')->insert([
        'passageiroId' => $passengerId,
        'origem' => 'Origem teste', 'latitudeOrigem' => -23.55, 'longitudeOrigem' => -46.63,
        'destino' => 'Destino teste', 'latitudeDestino' => -23.56, 'longitudeDestino' => -46.64,
        'status' => 'EmAndamento', 'dataSolicitacao' => now(),
    ]);

    $this->deleteJson('/api/account', ['senhaAtual' => passengerCredentials()['senha']], $headers)->assertStatus(409);
    expect(UserModel::findOrFail($registration->json('user.userId'))->statusConta)->toBe('Ativa')
        ->and(UserModel::findOrFail($registration->json('user.userId'))->tokens()->count())->toBe(1);
});

it('removes a passenger profile photo when the account is deactivated', function () {
    Storage::fake('public');

    $registration = $this->postJson('/api/passageiro/insert', passengerCredentials())->assertCreated();
    $headers = ['Authorization' => 'Bearer '.$registration->json('token')];
    $this->post('/api/account/photo', [
        'foto' => UploadedFile::fake()->create('perfil.jpg', 50, 'image/jpeg'),
    ], $headers)->assertOk();

    $user = UserModel::findOrFail($registration->json('user.userId'));
    $photoPath = $user->fotoPerfil;
    Storage::disk('public')->assertExists($photoPath);

    $this->deleteJson('/api/account', ['senhaAtual' => passengerCredentials()['senha']], $headers)
        ->assertOk()
        ->assertJsonPath('message', 'Conta excluída. Dados pessoais foram removidos ou pseudonimizados; alguns dados operacionais das corridas foram preservados.');

    expect($user->fresh()->fotoPerfil)->toBeNull()
        ->and($user->fresh()->statusConta)->toBe('Inativa');
    Storage::disk('public')->assertMissing($photoPath);
});

it('lets a driver update their profile and deactivate their own account', function () {
    $registration = $this->postJson('/api/motorista/insert', driverCredentials())->assertCreated();
    $headers = ['Authorization' => 'Bearer '.$registration->json('token')];
    $userId = $registration->json('user.userId');

    $this->putJson('/api/account', [
        'nome' => 'Carlos Atualizado',
        'email' => 'carlos.atualizado@example.test',
        'cpf' => '98765432100',
        'numeroTelefone' => '11977776666',
        'logradouro' => 'Rua Atualizada',
        'numero' => '8',
        'complemento' => '',
        'bairro' => 'Centro',
        'cidade' => 'Campinas',
        'estado' => 'SP',
        'cep' => '13000000',
        'senhaAtual' => driverCredentials()['senha'],
    ], $headers)
        ->assertOk()
        ->assertJsonPath('user.nome', 'Carlos Atualizado')
        ->assertJsonPath('motorista.motoristaId', $registration->json('motorista.motoristaId'));

    $this->deleteJson('/api/account', ['senhaAtual' => driverCredentials()['senha']], $headers)->assertOk();
    expect(UserModel::findOrFail($userId)->statusConta)->toBe('Inativa')
        ->and(UserModel::findOrFail($userId)->tokens()->count())->toBe(0);
});

it('allows passengers and drivers but not administrators to upload profile photos', function () {
    Storage::fake('public');

    $passenger = $this->postJson('/api/passageiro/insert', passengerCredentials())->assertCreated();
    $headers = [
        'Authorization' => 'Bearer '.$passenger->json('token'),
        'Accept' => 'application/json',
    ];

    $upload = $this->post('/api/account/photo', ['foto' => UploadedFile::fake()->create('perfil.jpg', 50, 'image/jpeg')], $headers)
        ->assertOk();
    $storedPhoto = UserModel::findOrFail($passenger->json('user.userId'))->fotoPerfil;
    expect(str_starts_with($storedPhoto, 'profile-photos/'.$passenger->json('user.userId').'/'))->toBeTrue()
        ->and($upload->json('fotoPerfil'))->toBe($storedPhoto)
        ->and($upload->json('user.fotoPerfil'))->toBe($storedPhoto);
    Storage::disk('public')->assertExists($storedPhoto);

    $replacement = $this->post('/api/account/photo', ['foto' => UploadedFile::fake()->create('novo-perfil.jpg', 50, 'image/jpeg')], $headers)
        ->assertOk();
    $replacementPath = $replacement->json('fotoPerfil');
    expect($replacementPath)->not->toBe($storedPhoto);
    Storage::disk('public')->assertMissing($storedPhoto);
    Storage::disk('public')->assertExists($replacementPath);

    $this->post('/api/account/photo', ['foto' => UploadedFile::fake()->create('arquivo.txt', 10, 'text/plain')], $headers)
        ->assertUnprocessable();

    resetApiAuth();
    $this->post('/api/account/photo', ['foto' => UploadedFile::fake()->create('sem-login.jpg', 50, 'image/jpeg')], [
        'Accept' => 'application/json',
    ])
        ->assertUnauthorized();

    resetApiAuth();
    $driver = $this->postJson('/api/motorista/insert', driverCredentials())->assertCreated();
    $this->post('/api/account/photo', ['foto' => UploadedFile::fake()->create('motorista.jpg', 50, 'image/jpeg')], [
        'Authorization' => 'Bearer '.$driver->json('token'),
        'Accept' => 'application/json',
    ])->assertOk();

    admModel::create([
        'userId' => $passenger->json('user.userId'),
        'nivelAcesso' => 'Operador',
    ]);
    resetApiAuth();
    $this->post('/api/account/photo', ['foto' => UploadedFile::fake()->create('admin.jpg', 50, 'image/jpeg')], $headers)
        ->assertForbidden();
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
