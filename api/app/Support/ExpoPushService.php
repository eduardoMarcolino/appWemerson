<?php

namespace App\Support;

use App\Notifications\SendRidePushNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ExpoPushService
{
    /** Queue a generic push so a slow external service cannot delay the ride API. */
    public function queueUsers(array $userIds): bool
    {
        $userIds = array_values(array_unique(array_filter(array_map('intval', $userIds))));
        if ($userIds === []) return true;

        try {
            SendRidePushNotification::dispatch($userIds);
            return true;
        } catch (Throwable $exception) {
            Log::warning('Não foi possível adicionar a notificação à fila.', [
                'exception' => get_class($exception),
            ]);
            return false;
        }
    }

    /** Send one event to all registered installations belonging to these accounts. */
    public function notifyUsers(array $userIds): bool
    {
        $userIds = array_values(array_unique(array_filter(array_map('intval', $userIds))));
        if ($userIds === []) return true;

        $tokens = DB::table('tbExpoPushToken')->whereIn('userId', $userIds)->pluck('expoPushToken')->all();
        if ($tokens === []) return true;

        foreach (array_chunk($tokens, 100) as $tokenBatch) {
            $messages = array_map(fn (string $token): array => [
                'to' => $token,
                'title' => 'Atualização do InteriorGo',
                'body' => 'Há uma atualização na sua corrida. Abra o app para consultar o status atual.',
                'sound' => 'default',
                'channelId' => 'rides',
                'priority' => 'high',
            ], $tokenBatch);

            try {
                $request = Http::timeout(10)->acceptJson()->asJson();
                $accessToken = config('services.expo.access_token');
                if (is_string($accessToken) && $accessToken !== '') {
                    $request = $request->withToken($accessToken);
                }
                $response = $request->post('https://exp.host/--/api/v2/push/send', $messages);
            } catch (Throwable $exception) {
                Log::warning('Falha de conexão com o serviço Expo Push.', [
                    'exception' => get_class($exception),
                ]);
                return false;
            }

            if (! $response->successful()) {
                Log::warning('Expo Push recusou o envio de notificações.', [
                    'httpStatus' => $response->status(),
                ]);
                return false;
            }

            $tickets = $response->json('data', []);
            foreach (is_array($tickets) ? $tickets : [] as $index => $ticket) {
                $errorCode = data_get($ticket, 'details.error');
                if ($errorCode === 'DeviceNotRegistered' && isset($tokenBatch[$index])) {
                    DB::table('tbExpoPushToken')->where('expoPushToken', $tokenBatch[$index])->delete();
                } elseif (data_get($ticket, 'status') === 'error') {
                    Log::warning('Expo Push informou falha em um token de dispositivo.', [
                        'errorCode' => $errorCode ?? 'unknown',
                    ]);
                }
            }
        }

        return true;
    }
}
