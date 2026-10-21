<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetCodeNotification extends Notification
{
    use Queueable;

    public function __construct(#[\SensitiveParameter] public string $token) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutes = (int) config('auth.passwords.users.expire', 15);

        return (new MailMessage)
            ->subject('Código para redefinir sua senha do InteriorGo')
            ->greeting('Olá, '.$notifiable->nome.'!')
            ->line('Recebemos uma solicitação para redefinir a senha da sua conta.')
            ->line('Use este código no aplicativo:')
            ->line($this->token)
            ->line("O código expira em {$minutes} minutos e só pode ser usado uma vez.")
            ->line('Se você não solicitou a troca, ignore esta mensagem.');
    }
}
