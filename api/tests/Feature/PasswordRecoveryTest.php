<?php

use App\Models\UserModel;
use App\Notifications\PasswordResetCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function passwordRecoveryTestUser(): UserModel
{
    return UserModel::create([
        'nome' => 'Pessoa Recuperação',
        'email' => 'pessoa.recuperacao@example.test',
        'senha' => Hash::make('senha-antiga-segura'),
        'cpf' => '52998224725',
        'dataCadastro' => now(),
        'statusConta' => 'Ativa',
    ]);
}

function passwordRecoveryTestPayload(string $email, string $token): array
{
    return [
        'email' => $email,
        'token' => $token,
        'password' => 'senha-nova-segura',
        'password_confirmation' => 'senha-nova-segura',
    ];
}

it('sends a generic response and resets a password with a single-use code', function () {
    Notification::fake();
    $user = passwordRecoveryTestUser();
    $accessToken = $user->createToken('app-passageiro')->plainTextToken;

    $response = $this->postJson('/api/password/forgot', ['email' => $user->email])
        ->assertOk()
        ->assertJsonPath('message', 'Se existir uma conta com esse e-mail, enviaremos um código de redefinição.');

    $this->postJson('/api/password/forgot', ['email' => 'nao.existe@example.test'])
        ->assertOk()
        ->assertExactJson($response->json());

    $sentNotification = null;
    Notification::assertSentTo($user, PasswordResetCodeNotification::class, function (PasswordResetCodeNotification $notification) use (&$sentNotification): bool {
        $sentNotification = $notification;

        return true;
    });
    expect($sentNotification)->not->toBeNull();

    $resetPayload = passwordRecoveryTestPayload($user->email, $sentNotification->token);
    $this->postJson('/api/password/reset', $resetPayload)
        ->assertOk()
        ->assertJsonPath('message', 'Senha redefinida. Entre novamente com a nova senha.');

    expect(Hash::check('senha-nova-segura', $user->fresh()->senha))->toBeTrue()
        ->and($user->tokens()->count())->toBe(0);
    $this->postJson('/api/password/reset', $resetPayload)->assertUnprocessable();
});

it('rejects an expired recovery code', function () {
    Notification::fake();
    $user = passwordRecoveryTestUser();
    $this->postJson('/api/password/forgot', ['email' => $user->email])->assertOk();

    $sentNotification = null;
    Notification::assertSentTo($user, PasswordResetCodeNotification::class, function (PasswordResetCodeNotification $notification) use (&$sentNotification): bool {
        $sentNotification = $notification;

        return true;
    });

    $this->travel(16)->minutes();
    $this->postJson('/api/password/reset', passwordRecoveryTestPayload($user->email, $sentNotification->token))
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Código inválido ou expirado. Solicite um novo código e tente novamente.');
});
