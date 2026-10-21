<?php

namespace App\Http\Controllers;

use App\Models\UserModel;
use App\Notifications\PasswordResetCodeNotification;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

class PasswordRecoveryController extends Controller
{
    public function sendCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:150'],
        ]);

        $email = mb_strtolower(trim($data['email']));
        Password::broker('users')->sendResetLink(
            ['email' => $email],
            function (UserModel $user, string $token): void {
                $user->notify(new PasswordResetCodeNotification($token));
            },
        );

        Log::info('Solicitação de código de redefinição de senha recebida.');

        return response()->json([
            'message' => 'Se existir uma conta com esse e-mail, enviaremos um código de redefinição.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:150'],
            'token' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
            'password_confirmation' => ['required', 'string', 'min:8', 'max:255'],
        ]);

        $status = Password::broker('users')->reset([
            'email' => mb_strtolower(trim($data['email'])),
            'token' => $data['token'],
            'password' => $data['password'],
            'password_confirmation' => $data['password_confirmation'],
        ], function (UserModel $user, string $password): void {
            $user->forceFill(['senha' => Hash::make($password)])->save();
            $user->tokens()->delete();
            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            Log::notice('Redefinição de senha recusada por código inválido, expirado ou indisponível.');

            return response()->json([
                'message' => 'Código inválido ou expirado. Solicite um novo código e tente novamente.',
            ], 422);
        }

        Log::info('Senha redefinida com sucesso. Os tokens de acesso anteriores foram revogados.');

        return response()->json([
            'message' => 'Senha redefinida. Entre novamente com a nova senha.',
        ]);
    }
}
