<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;
use App\Support\ExpoPushService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('interiorgo:send-scheduled-reminders', function (ExpoPushService $push): void {
    $from = now();
    $until = now()->addMinutes(30);
    $schedules = DB::table('tbCorridaAgendada as agenda')
        ->join('tbCorrida as corrida', 'corrida.corridaAgendadaId', '=', 'agenda.corridaAgendadaId')
        ->join('tbPassageiro as passageiro', 'passageiro.passageiroId', '=', 'agenda.passageiroId')
        ->leftJoin('tbMotorista as motorista', 'motorista.motoristaId', '=', 'agenda.motoristaId')
        ->whereIn('agenda.status', ['Agendada', 'Confirmada'])
        ->whereNull('agenda.lembreteEnviadoEm')
        ->whereBetween('agenda.dataHora', [$from, $until])
        ->orderBy('agenda.corridaAgendadaId')
        ->get([
            'agenda.corridaAgendadaId',
            'passageiro.userId as passageiroUserId',
            'motorista.userId as motoristaUserId',
        ]);

    foreach ($schedules as $schedule) {
        $userIds = array_filter([(int) $schedule->passageiroUserId, $schedule->motoristaUserId ? (int) $schedule->motoristaUserId : null]);
        if (! $push->queueUsers($userIds)) {
            continue;
        }

        DB::table('tbCorridaAgendada')
            ->where('corridaAgendadaId', $schedule->corridaAgendadaId)
            ->whereNull('lembreteEnviadoEm')
            ->update(['lembreteEnviadoEm' => now()]);
        Log::info('Lembrete de corrida agendada processado.', [
            'corridaAgendadaId' => $schedule->corridaAgendadaId,
        ]);
    }
})->purpose('Send push reminders for scheduled rides starting in about 30 minutes');

Schedule::command('interiorgo:send-scheduled-reminders')
    ->everyMinute()
    ->withoutOverlapping();
