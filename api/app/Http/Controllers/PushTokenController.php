<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class PushTokenController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255', 'regex:/^(Exponent|Expo)PushToken\\[[A-Za-z0-9-]+\\]$/'],
            'platform' => ['required', Rule::in(['android', 'ios'])],
        ]);
        $now = now();
        DB::table('tbExpoPushToken')->updateOrInsert(
            ['expoPushToken' => $data['token']],
            [
                'userId' => $request->user()->userId,
                'platform' => $data['platform'],
                'dataRegistro' => $now,
                'atualizadoEm' => $now,
            ],
        );

        Log::info('Token de notificação Expo registrado.', [
            'userId' => $request->user()->userId,
            'platform' => $data['platform'],
        ]);

        return response()->json(['message' => 'Dispositivo registrado para notificações.']);
    }

    public function unregister(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'max:255']]);
        DB::table('tbExpoPushToken')
            ->where('userId', $request->user()->userId)
            ->where('expoPushToken', $data['token'])
            ->delete();

        return response()->json(['message' => 'Dispositivo removido das notificações.']);
    }
}
