<?php

namespace App\Notifications;

use App\Support\ExpoPushService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use RuntimeException;

class SendRidePushNotification implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public array $backoff = [5, 30, 60];

    public function __construct(public array $userIds)
    {
    }

    public function handle(ExpoPushService $push): void
    {
        if (! $push->notifyUsers($this->userIds)) {
            throw new RuntimeException('Expo Push não confirmou o envio da notificação.');
        }
    }
}
