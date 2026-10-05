<?php

namespace App\Http\Controllers;

use App\Models\AvaliacaoModel;
use App\Models\CorridaAgendadaModel;
use App\Models\CorridaModel;
use App\Models\LocalizacaoModel;
use App\Models\MotoristaModel;
use App\Models\PagamentoModel;
use App\Models\PassageiroModel;
use App\Models\VeiculoModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CorridaController extends Controller
{
    public function passageiroIndex(Request $request): JsonResponse
    {
        $passageiro = $this->passenger($request);
        $rides = CorridaModel::where('passageiroId', $passageiro->passageiroId)
            ->orderByDesc('dataSolicitacao')
            ->get()
            ->map(fn (CorridaModel $ride) => $this->ridePayload($ride));

        return response()->json($rides);
    }

    public function motoristaIndex(Request $request): JsonResponse
    {
        $motorista = $this->approvedDriver($request);
        $rides = CorridaModel::where('motoristaId', $motorista->motoristaId)
            ->orderByDesc('dataSolicitacao')
            ->get()
            ->map(fn (CorridaModel $ride) => $this->ridePayload($ride));

        return response()->json($rides);
    }

    public function ofertas(Request $request): JsonResponse
    {
        $driver = $this->approvedDriver($request);
        $categories = VeiculoModel::where('motoristaId', $driver->motoristaId)->pluck('categoria');

        $rides = CorridaModel::whereNull('motoristaId')
            ->where('status', 'Solicitada')
            ->whereIn('categoria', $categories)
            ->where(function (Builder $query): void {
                $query->whereNull('corridaAgendadaId')
                    ->orWhereHas('agendamento', fn (Builder $schedule) => $schedule->where('dataHora', '<=', now()));
            })
            ->orderBy('dataSolicitacao')
            ->get()
            ->map(fn (CorridaModel $ride) => $this->ridePayload($ride));

        return response()->json($rides);
    }

    public function agendadas(Request $request): JsonResponse
    {
        $driver = $this->approvedDriver($request);
        $categories = VeiculoModel::where('motoristaId', $driver->motoristaId)->pluck('categoria');

        $rides = CorridaModel::whereNull('motoristaId')
            ->where('status', 'Solicitada')
            ->whereNotNull('corridaAgendadaId')
            ->whereIn('categoria', $categories)
            ->whereHas('agendamento', fn (Builder $query) => $query->where('dataHora', '>', now()))
            ->orderBy('dataSolicitacao')
            ->get()
            ->map(fn (CorridaModel $ride) => $this->ridePayload($ride));

        return response()->json($rides);
    }

    public function store(Request $request): JsonResponse
    {
        $passenger = $this->passenger($request);
        $data = $request->validate([
            'origem' => ['required', 'string', 'max:255'],
            'latitudeOrigem' => ['required', 'numeric', 'between:-90,90'],
            'longitudeOrigem' => ['required', 'numeric', 'between:-180,180'],
            'destino' => ['required', 'string', 'max:255'],
            'latitudeDestino' => ['required', 'numeric', 'between:-90,90'],
            'longitudeDestino' => ['required', 'numeric', 'between:-180,180'],
            'categoria' => ['required', 'in:Economico,Comfort,SUV,Moto'],
            'beneficiarioNome' => ['nullable', 'string', 'max:150'],
            'beneficiarioTelefone' => ['nullable', 'string', 'max:20'],
            'dataHora' => ['nullable', 'date', 'after:now'],
            'tokenCompartilhamento' => ['nullable', 'string', 'max:255'],
        ]);

        $distance = $this->distanceKm(
            (float) $data['latitudeOrigem'],
            (float) $data['longitudeOrigem'],
            (float) $data['latitudeDestino'],
            (float) $data['longitudeDestino'],
        );
        $multiplier = ['Economico' => 1.0, 'Comfort' => 1.4, 'SUV' => 1.7, 'Moto' => 0.8][$data['categoria']];
        $fare = round((4 + ($distance * 2.5)) * $multiplier, 2);

        $ride = DB::transaction(function () use ($data, $passenger, $distance, $fare): CorridaModel {
            $schedule = null;
            if (! empty($data['dataHora'])) {
                $schedule = CorridaAgendadaModel::create([
                    'passageiroId' => $passenger->passageiroId,
                    'origem' => $data['origem'],
                    'destino' => $data['destino'],
                    'dataHora' => $data['dataHora'],
                    'status' => 'Agendada',
                ]);
            }

            return CorridaModel::create([
                'passageiroId' => $passenger->passageiroId,
                'corridaAgendadaId' => $schedule?->corridaAgendadaId,
                'origem' => $data['origem'],
                'latitudeOrigem' => $data['latitudeOrigem'],
                'longitudeOrigem' => $data['longitudeOrigem'],
                'destino' => $data['destino'],
                'latitudeDestino' => $data['latitudeDestino'],
                'longitudeDestino' => $data['longitudeDestino'],
                'categoria' => $data['categoria'],
                'distanciaKm' => $distance,
                'valorCorrida' => $fare,
                'beneficiarioNome' => $data['beneficiarioNome'] ?? null,
                'beneficiarioTelefone' => $data['beneficiarioTelefone'] ?? null,
                'tokenCompartilhamento' => $data['tokenCompartilhamento'] ?? null,
                'status' => 'Solicitada',
            ]);
        });

        return response()->json([
            'message' => $ride->corridaAgendadaId ? 'Corrida agendada.' : 'Corrida solicitada.',
            'corrida' => $this->ridePayload($ride),
        ], 201);
    }

    public function show(Request $request, int $corrida): JsonResponse
    {
        $ride = CorridaModel::findOrFail($corrida);
        $this->assertParticipant($request, $ride);

        return response()->json($this->ridePayload($ride));
    }

    public function aceitar(Request $request, int $corrida): JsonResponse
    {
        $driver = $this->approvedDriver($request);
        $ride = DB::transaction(function () use ($corrida, $driver): CorridaModel {
            $ride = CorridaModel::whereKey($corrida)->lockForUpdate()->firstOrFail();
            abort_unless($ride->status === 'Solicitada' && $ride->motoristaId === null, 409, 'Esta corrida já não está disponível.');
            abort_unless(
                VeiculoModel::where('motoristaId', $driver->motoristaId)->where('categoria', $ride->categoria)->exists(),
                422,
                'Você não possui veículo compatível com esta categoria.',
            );

            $ride->motoristaId = $driver->motoristaId;
            $ride->status = 'Aceita';
            $ride->save();

            if ($ride->corridaAgendadaId) {
                CorridaAgendadaModel::whereKey($ride->corridaAgendadaId)
                    ->update(['motoristaId' => $driver->motoristaId, 'status' => 'Confirmada']);
            }

            return $ride->fresh();
        });

        return response()->json(['message' => 'Corrida aceita.', 'corrida' => $this->ridePayload($ride)]);
    }

    public function chegou(Request $request, int $corrida): JsonResponse
    {
        return $this->transition($request, $corrida, 'Aceita', 'MotoristaChegando');
    }

    public function iniciar(Request $request, int $corrida): JsonResponse
    {
        return $this->transition($request, $corrida, 'MotoristaChegando', 'EmAndamento');
    }

    public function finalizar(Request $request, int $corrida): JsonResponse
    {
        $driver = $this->approvedDriver($request);
        $ride = DB::transaction(function () use ($corrida, $driver): CorridaModel {
            $ride = CorridaModel::whereKey($corrida)->lockForUpdate()->firstOrFail();
            abort_unless(
                $ride->motoristaId === $driver->motoristaId && $ride->status === 'EmAndamento',
                409,
                'A corrida precisa estar em andamento para ser finalizada.',
            );

            $ride->status = 'Finalizada';
            $ride->dataFim = now();
            $ride->save();

            PagamentoModel::firstOrCreate(
                ['corridaId' => $ride->corridaId],
                [
                    'valorPago' => $ride->valorCorrida,
                    'formaPagamento' => 'Dinheiro',
                    'statusPagamento' => 'Pendente',
                ],
            );

            if ($ride->corridaAgendadaId) {
                CorridaAgendadaModel::whereKey($ride->corridaAgendadaId)->update(['status' => 'Concluida']);
            }

            return $ride->fresh();
        });

        return response()->json(['message' => 'Corrida finalizada.', 'corrida' => $this->ridePayload($ride)]);
    }

    public function cancelar(Request $request, int $corrida): JsonResponse
    {
        $data = $request->validate(['motivoCancelamento' => ['nullable', 'string', 'max:255']]);
        $ride = DB::transaction(function () use ($request, $corrida, $data): CorridaModel {
            $ride = CorridaModel::whereKey($corrida)->lockForUpdate()->firstOrFail();
            $this->assertParticipant($request, $ride);
            abort_unless(in_array($ride->status, ['Solicitada', 'Aceita', 'MotoristaChegando'], true), 409, 'Esta corrida não pode mais ser cancelada.');

            $ride->status = 'Cancelada';
            $ride->motivoCancelamento = $data['motivoCancelamento'] ?? null;
            $ride->save();
            if ($ride->corridaAgendadaId) {
                CorridaAgendadaModel::whereKey($ride->corridaAgendadaId)->update(['status' => 'Cancelada']);
            }

            return $ride;
        });

        return response()->json(['message' => 'Corrida cancelada.', 'corrida' => $this->ridePayload($ride)]);
    }

    public function pagar(Request $request, int $corrida): JsonResponse
    {
        $passenger = $this->passenger($request);
        $data = $request->validate([
            'formaPagamento' => ['required', 'in:Pix,Dinheiro,CartaoCredito,CartaoDebito,CarteiraDigital'],
        ]);
        $ride = CorridaModel::findOrFail($corrida);
        abort_unless($ride->passageiroId === $passenger->passageiroId, 403);
        abort_unless($ride->status === 'Finalizada', 409, 'O pagamento só pode ser confirmado após a conclusão da corrida.');

        $payment = DB::transaction(function () use ($ride, $data): PagamentoModel {
            $payment = PagamentoModel::where('corridaId', $ride->corridaId)->lockForUpdate()->first();
            abort_unless(! $payment || $payment->statusPagamento !== 'Pago', 409, 'Esta corrida já foi paga.');

            if (! $payment) {
                $payment = new PagamentoModel;
                $payment->corridaId = $ride->corridaId;
            }
            $payment->valorPago = $ride->valorCorrida;
            $payment->formaPagamento = $data['formaPagamento'];
            $payment->statusPagamento = 'Pago';
            $payment->dataPagamento = now();
            $payment->save();

            return $payment;
        });

        return response()->json([
            'message' => 'Pagamento de teste registrado. Nenhuma cobrança real foi processada.',
            'testOnly' => true,
            'pagamento' => $payment,
        ]);
    }

    public function avaliar(Request $request, int $corrida): JsonResponse
    {
        $data = $request->validate([
            'nota' => ['required', 'integer', 'between:1,5'],
            'comentario' => ['nullable', 'string', 'max:1000'],
        ]);
        $ride = CorridaModel::findOrFail($corrida);
        abort_unless($ride->status === 'Finalizada', 409, 'A corrida precisa estar finalizada antes da avaliação.');

        if ($request->user()->passageiro()->exists()) {
            $passenger = $this->passenger($request);
            abort_unless($ride->passageiroId === $passenger->passageiroId, 403);
            $role = 'Passageiro';
        } else {
            $driver = $this->approvedDriver($request);
            abort_unless($ride->motoristaId === $driver->motoristaId, 403);
            $role = 'Motorista';
        }

        $payment = PagamentoModel::where('corridaId', $ride->corridaId)->first();
        abort_unless($payment?->statusPagamento === 'Pago', 409, 'Confirme o pagamento antes de avaliar a corrida.');
        abort_if(AvaliacaoModel::where('corridaId', $ride->corridaId)->where('avaliadoPor', $role)->exists(), 409, 'Você já avaliou esta corrida.');

        $rating = AvaliacaoModel::create([
            'corridaId' => $ride->corridaId,
            'passageiroId' => $ride->passageiroId,
            'motoristaId' => $ride->motoristaId,
            'avaliadoPor' => $role,
            'nota' => $data['nota'],
            'comentario' => $data['comentario'] ?? null,
        ]);

        if ($role === 'Passageiro') {
            MotoristaModel::where('motoristaId', $ride->motoristaId)->update([
                'avaliacaoMedia' => AvaliacaoModel::where('motoristaId', $ride->motoristaId)
                    ->where('avaliadoPor', 'Passageiro')
                    ->avg('nota'),
            ]);
        }

        return response()->json(['message' => 'Avaliação registrada.', 'avaliacao' => $rating], 201);
    }

    public function localizar(Request $request, int $corrida): JsonResponse
    {
        $driver = $this->approvedDriver($request);
        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);
        $ride = CorridaModel::findOrFail($corrida);
        abort_unless($ride->motoristaId === $driver->motoristaId, 403);
        abort_unless(in_array($ride->status, ['Aceita', 'MotoristaChegando', 'EmAndamento'], true), 409, 'Não há corrida ativa para atualizar a localização.');

        $location = LocalizacaoModel::create([
            'corridaId' => $ride->corridaId,
            'motoristaId' => $driver->motoristaId,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'dataHora' => now(),
        ]);

        return response()->json($location, 201);
    }

    private function transition(Request $request, int $id, string $from, string $to): JsonResponse
    {
        $driver = $this->approvedDriver($request);
        $ride = DB::transaction(function () use ($id, $driver, $from, $to): CorridaModel {
            $ride = CorridaModel::whereKey($id)->lockForUpdate()->firstOrFail();
            abort_unless($ride->motoristaId === $driver->motoristaId && $ride->status === $from, 409, "A corrida precisa estar em {$from}.");
            $ride->status = $to;
            if ($to === 'EmAndamento') {
                if ($ride->corridaAgendadaId) {
                    $schedule = CorridaAgendadaModel::findOrFail($ride->corridaAgendadaId);
                    abort_unless($schedule->dataHora <= now(), 409, 'Esta corrida ainda não chegou ao horário agendado.');
                }
                $ride->dataInicio = now();
            }
            $ride->save();

            if ($to === 'EmAndamento' && $ride->corridaAgendadaId) {
                CorridaAgendadaModel::whereKey($ride->corridaAgendadaId)->update(['status' => 'EmAndamento']);
            }

            return $ride->fresh();
        });

        return response()->json(['message' => 'Status da corrida atualizado.', 'corrida' => $this->ridePayload($ride)]);
    }

    private function passenger(Request $request): PassageiroModel
    {
        $passenger = PassageiroModel::where('userId', $request->user()->userId)->first();
        abort_unless($passenger && $passenger->status === 'Ativo', 403, 'Esta conta não é de um passageiro ativo.');

        return $passenger;
    }

    private function approvedDriver(Request $request): MotoristaModel
    {
        $driver = MotoristaModel::where('userId', $request->user()->userId)->first();
        abort_unless($driver && $driver->statusMotorista === 'Aprovado', 403, 'Esta conta não é de um motorista aprovado.');

        return $driver;
    }

    private function assertParticipant(Request $request, CorridaModel $ride): void
    {
        $passenger = PassageiroModel::where('userId', $request->user()->userId)->first();
        $driver = MotoristaModel::where('userId', $request->user()->userId)->first();
        abort_unless(
            ($passenger && $ride->passageiroId === $passenger->passageiroId)
                || ($driver && $ride->motoristaId === $driver->motoristaId),
            403,
        );
    }

    private function ridePayload(CorridaModel $ride): array
    {
        $driver = $ride->motoristaId
            ? MotoristaModel::with(['user', 'veiculos'])->find($ride->motoristaId)
            : null;

        return [
            'corrida' => $ride,
            'motorista' => $driver,
            'agendamento' => $ride->corridaAgendadaId
                ? CorridaAgendadaModel::find($ride->corridaAgendadaId)
                : null,
            'pagamento' => PagamentoModel::where('corridaId', $ride->corridaId)->first(),
            'localizacao' => LocalizacaoModel::where('corridaId', $ride->corridaId)->latest('dataHora')->first(),
        ];
    }

    private function distanceKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371;
        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);
        $a = sin($latDelta / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($lonDelta / 2) ** 2;

        return round(2 * $earthRadius * asin(min(1, sqrt($a))), 2);
    }
}
