<?php

use App\Models\admModel;
use App\Models\EventoModel;
use App\Models\MotoristaModel;
use App\Models\UserModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function createPanelAdministrator(string $level = 'Master'): UserModel
{
    $user = UserModel::create([
        'nome' => 'Admin de Teste',
        'email' => $level === 'Master' ? 'master@example.test' : 'operator@example.test',
        'senha' => Hash::make('senha-master-segura'),
        'cpf' => $level === 'Master' ? '12312312387' : '32132132178',
        'dataCadastro' => now(),
        'statusConta' => 'Ativa',
    ]);

    admModel::create(['userId' => $user->userId, 'nivelAcesso' => $level]);

    return $user;
}

it('allows Operators to access the dashboard and events but not account management', function () {
    $operator = createPanelAdministrator('Operador');
    $this->post('/admin/login', [
        'email' => 'operator@example.test',
        'senha' => 'senha-master-segura',
    ])->assertRedirect('/admin');
    $this->get('/admin')->assertOk()->assertSee('Dashboard')->assertSee('Operador');
    $this->get('/admin/eventos')->assertOk();
    $this->get('/admin/eventos/criar')->assertOk();
    $this->get('/admin/contas')->assertForbidden();

    $this->post('/admin/eventos', [
        'nome' => 'Evento do Operador',
        'descricao' => 'Cadastro permitido',
        'local' => 'Praça Central',
        'dataInicio' => now()->addDays(10)->format('Y-m-d\TH:i'),
        'dataFim' => now()->addDays(10)->addHours(4)->format('Y-m-d\TH:i'),
        'categoria' => 'Cultura',
        'cidade' => 'Campinas',
    ])->assertRedirect('/admin/eventos');
    $event = EventoModel::firstOrFail();
    expect($event->administradorId)->toBe($operator->administrador->administradorId)
        ->and($event->ativo)->toBeTrue();

    $this->put("/admin/eventos/{$event->eventoId}", [
        'nome' => 'Evento do Operador Atualizado',
        'descricao' => 'Edição permitida',
        'local' => 'Parque Central',
        'dataInicio' => now()->addDays(11)->format('Y-m-d\TH:i'),
        'dataFim' => now()->addDays(11)->addHours(4)->format('Y-m-d\TH:i'),
        'categoria' => 'Cultura',
        'cidade' => 'Campinas',
    ])->assertRedirect('/admin/eventos');
    $this->patch("/admin/eventos/{$event->eventoId}/status")->assertRedirect('/admin/eventos');
    expect($event->fresh()->nome)->toBe('Evento do Operador Atualizado')
        ->and($event->fresh()->ativo)->toBeFalse();

    $this->post('/admin/logout')->assertRedirect('/admin/login');
    $this->get('/admin')->assertRedirect('/admin/login');
});

it('allows only Master administrators to manage customer accounts', function () {
    createPanelAdministrator();
    $this->post('/admin/login', [
        'email' => 'master@example.test',
        'senha' => 'senha-master-segura',
    ])->assertRedirect('/admin');
    $this->get('/admin/contas')->assertOk()->assertSee('Contas');
});

it('allows only a Master to register Operators', function () {
    $this->get('/admin/cadastro')->assertRedirect('/admin/login');
    $this->post('/admin/cadastro', [
        'nome' => 'Operadora Nova',
        'email' => 'nova.operadora@example.test',
        'cpf' => '11144477735',
        'senha' => 'senha-operadora-segura',
        'senha_confirmation' => 'senha-operadora-segura',
    ])->assertRedirect('/admin/login');

    expect(UserModel::where('email', 'nova.operadora@example.test')->exists())->toBeFalse();

    createPanelAdministrator();
    $this->post('/admin/login', [
        'email' => 'master@example.test',
        'senha' => 'senha-master-segura',
    ])->assertRedirect('/admin');
    $this->get('/admin/cadastro')->assertOk()->assertSee('Criar conta de Operador');
    $this->post('/admin/cadastro', [
        'nome' => 'Operadora Nova',
        'email' => 'nova.operadora@example.test',
        'cpf' => '11144477735',
        'senha' => 'senha-operadora-segura',
        'senha_confirmation' => 'senha-operadora-segura',
    ])->assertRedirect('/admin/login');

    $user = UserModel::where('email', 'nova.operadora@example.test')->firstOrFail();
    expect($user->administrador->nivelAcesso)->toBe('Operador');

    $this->post('/admin/login', [
        'email' => 'nova.operadora@example.test',
        'senha' => 'senha-operadora-segura',
    ])->assertRedirect('/admin');
    $this->get('/admin')->assertOk()->assertSee('Operador');
    $this->get('/admin/cadastro')->assertForbidden();
    $this->get('/admin/contas')->assertForbidden();
});

it('does not expose the legacy API endpoint that created Master administrators', function () {
    $this->postJson('/api/admin/insert', [
        'nome' => 'Master Não Autorizado',
        'email' => 'ataque@example.test',
        'senha' => 'senha-qualquer',
        'cpf' => '52998224725',
    ])->assertNotFound();

    expect(UserModel::where('email', 'ataque@example.test')->exists())->toBeFalse();
});

it('limits passenger API login attempts', function () {
    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->postJson('/api/loginPassageiro', [
            'email' => 'nao-existe@example.test',
            'senha' => 'senha-invalida',
        ])->assertUnprocessable();
    }

    $this->postJson('/api/loginPassageiro', [
        'email' => 'nao-existe@example.test',
        'senha' => 'senha-invalida',
    ])->assertTooManyRequests();
});

it('lets a Master update and deactivate a customer account and revokes its tokens', function () {
    createPanelAdministrator();
    $user = UserModel::create([
        'nome' => 'Motorista de Teste',
        'email' => 'driver@example.test',
        'senha' => Hash::make('senha-driver'),
        'cpf' => '98798798723',
        'dataCadastro' => now(),
        'statusConta' => 'Ativa',
    ]);
    $driver = MotoristaModel::create([
        'userId' => $user->userId,
        'cnh' => '12345678900',
        'validadeCNH' => now()->addYear()->toDateString(),
        'avaliacaoMedia' => 0,
        'statusMotorista' => 'Pendente',
    ]);
    $user->createToken('driver-app');

    $this->post('/admin/login', [
        'email' => 'master@example.test',
        'senha' => 'senha-master-segura',
    ])->assertRedirect('/admin');

    $this->put("/admin/contas/{$user->userId}", [
        'nome' => 'Motorista Atualizado',
        'email' => 'driver.updated@example.test',
        'cpf' => '98798798723',
        'statusConta' => 'Inativa',
        'statusMotorista' => 'Aprovado',
        'confirmacaoDocumentos' => 'on',
    ])->assertRedirect("/admin/contas/{$user->userId}/editar");
    $this->get("/admin/contas/{$user->userId}/editar")->assertOk()->assertSee('Motorista Atualizado');

    expect($user->fresh()->nome)->toBe('Motorista Atualizado')
        ->and($user->fresh()->statusConta)->toBe('Inativa')
        ->and($driver->fresh()->statusMotorista)->toBe('Aprovado')
        ->and($user->tokens()->count())->toBe(0);
});

it('requires an administrator to confirm driver documents before approval', function () {
    createPanelAdministrator();
    $user = UserModel::create([
        'nome' => 'Motorista Pendente',
        'email' => 'pendente@example.test',
        'senha' => Hash::make('senha-driver'),
        'cpf' => '98798798723',
        'dataCadastro' => now(),
        'statusConta' => 'Ativa',
    ]);
    $driver = MotoristaModel::create([
        'userId' => $user->userId,
        'cnh' => '12345678900',
        'validadeCNH' => now()->addYear()->toDateString(),
        'avaliacaoMedia' => 0,
        'statusMotorista' => 'Pendente',
    ]);

    $this->post('/admin/login', [
        'email' => 'master@example.test',
        'senha' => 'senha-master-segura',
    ])->assertRedirect('/admin');

    $this->put("/admin/contas/{$user->userId}", [
        'nome' => $user->nome,
        'email' => $user->email,
        'cpf' => $user->cpf,
        'statusConta' => 'Ativa',
        'statusMotorista' => 'Aprovado',
    ])->assertSessionHasErrors('confirmacaoDocumentos');

    expect($driver->fresh()->statusMotorista)->toBe('Pendente');
});

it('lets a Master create, edit, and deactivate events', function () {
    $administrator = createPanelAdministrator();
    $this->post('/admin/login', [
        'email' => 'master@example.test',
        'senha' => 'senha-master-segura',
    ])->assertRedirect('/admin');
    $this->get('/admin/eventos/criar')->assertOk()->assertSee('Cadastrar evento');

    $this->post('/admin/eventos', [
        'nome' => 'Festa da Cidade',
        'descricao' => 'Evento anual',
        'local' => 'Praça Central',
        'dataInicio' => now()->addDays(10)->format('Y-m-d\TH:i'),
        'dataFim' => now()->addDays(10)->addHours(4)->format('Y-m-d\TH:i'),
        'categoria' => 'Cultura',
        'cidade' => 'Campinas',
    ])->assertRedirect('/admin/eventos');

    $event = EventoModel::firstOrFail();
    expect($event->administradorId)->toBe($administrator->administrador->administradorId)
        ->and($event->ativo)->toBeTrue();

    $this->put("/admin/eventos/{$event->eventoId}", [
        'nome' => 'Festa da Cidade Atualizada',
        'descricao' => '',
        'local' => 'Parque Central',
        'dataInicio' => now()->addDays(11)->format('Y-m-d\TH:i'),
        'dataFim' => now()->addDays(11)->addHours(4)->format('Y-m-d\TH:i'),
        'categoria' => 'Cultura',
        'cidade' => 'Campinas',
    ])->assertRedirect('/admin/eventos');
    $this->patch("/admin/eventos/{$event->eventoId}/status")->assertRedirect('/admin/eventos');

    expect($event->fresh()->nome)->toBe('Festa da Cidade Atualizada')
        ->and($event->fresh()->ativo)->toBeFalse();
});
