<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicRidePayloadResource;
use App\Models\AvaliacaoModel;
use App\Models\CorridaAgendadaModel;
use App\Models\CorridaModel;
use App\Models\MotoristaModel;
use App\Models\PagamentoModel;
use App\Models\PassageiroModel;
use App\Models\VeiculoModel;
use App\Support\RideCatalog;
use App\Support\ExpoPushService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Throwable;

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

    public function ativa(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->statusConta === 'Ativa', 403, 'Esta conta não está ativa.');

        $passenger = PassageiroModel::where('userId', $user->userId)
            ->where('status', 'Ativo')
            ->first();

        if ($passenger) {
            $ride = CorridaModel::where('passageiroId', $passenger->passageiroId)
                ->whereIn('status', ['Solicitada', 'Aceita', 'MotoristaChegando', 'EmAndamento'])
                ->orderByDesc('dataSolicitacao')
                ->orderByDesc('corridaId')
                ->first();
        } else {
            $driver = MotoristaModel::where('userId', $user->userId)->first();

            if (! $driver) {
                abort(403, 'Esta conta não pertence a um passageiro ou motorista.');
            }

            $ride = $driver->statusMotorista === 'Aprovado'
                ? CorridaModel::where('motoristaId', $driver->motoristaId)
                    ->whereIn('status', ['Aceita', 'MotoristaChegando', 'EmAndamento'])
                    ->orderByDesc('dataSolicitacao')
                    ->orderByDesc('corridaId')
                    ->first()
                : null;
        }

        return response()->json([
            'activeRide' => $ride ? $this->ridePayload($ride) : null,
        ]);
    }

    public function ofertas(Request $request): JsonResponse
    {
        $driver = $this->approvedDriver($request);
        $categories = VeiculoModel::where('motoristaId', $driver->motoristaId)->pluck('categoria');

        $rides = CorridaModel::whereNull('motoristaId')
            ->where('status', 'Solicitada')
            ->whereIn('categoria', $categories)
            ->whereNotExists(fn ($query) => $query->selectRaw('1')->from('tbCorridaRecusada')
                ->whereColumn('tbCorridaRecusada.corridaId', 'tbCorrida.corridaId')
                ->where('tbCorridaRecusada.motoristaId', $driver->motoristaId))
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
            ->whereNotExists(fn ($query) => $query->selectRaw('1')->from('tbCorridaRecusada')
                ->whereColumn('tbCorridaRecusada.corridaId', 'tbCorrida.corridaId')
                ->where('tbCorridaRecusada.motoristaId', $driver->motoristaId))
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
            'categoria' => ['required', Rule::in(RideCatalog::categoryValues())],
            'beneficiarioNome' => ['nullable', 'string', 'max:150'],
            'beneficiarioTelefone' => ['nullable', 'string', 'max:20'],
            'dataHora' => ['nullable', 'date', 'after:now'],
            'tokenCompartilhamento' => ['nullable', 'string', 'max:255'],
        ]);

        // Converte a data recebida para UTC e para o formato
        // convencional aceito pela coluna DATETIME do MySQL.
        $dataHoraAgendada = null;

        if (! empty($data['dataHora'])) {
            $dataHoraAgendada = Carbon::parse($data['dataHora'])
                ->utc()
                ->format('Y-m-d H:i:s');
        }

        $distance = $this->distanceKm(
            (float) $data['latitudeOrigem'],
            (float) $data['longitudeOrigem'],
            (float) $data['latitudeDestino'],
            (float) $data['longitudeDestino'],
        );

        $multiplier = RideCatalog::fareMultipliers()[$data['categoria']];
        $fare = round((4 + ($distance * 2.5)) * $multiplier, 2);

        try {
            $ride = DB::transaction(function () use (
                $data,
                $passenger,
                $distance,
                $fare,
                $dataHoraAgendada
            ): CorridaModel {
                $passenger = PassageiroModel::whereKey($passenger->passageiroId)->lockForUpdate()->firstOrFail();
                abort_if(
                    CorridaModel::where('passageiroId', $passenger->passageiroId)
                        ->whereIn('status', ['Solicitada', 'Aceita', 'MotoristaChegando', 'EmAndamento'])
                        ->exists(),
                    409,
                    'Você já tem uma solicitação pendente ou uma corrida ativa. Conclua ou cancele antes de pedir outra.',
                );
                $schedule = null;

                if ($dataHoraAgendada !== null) {
                    $schedule = CorridaAgendadaModel::create([
                        'passageiroId' => $passenger->passageiroId,
                        'origem' => $data['origem'],
                        'destino' => $data['destino'],
                        'dataHora' => $dataHoraAgendada,
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
        } catch (Throwable $exception) {
            Log::error('Falha ao criar corrida no InteriorGo.', [
                'exception' => get_class($exception),
                'message' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        return response()->json([
            'message' => $ride->corridaAgendadaId
                ? 'Corrida agendada.'
                : 'Corrida solicitada.',
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
            MotoristaModel::whereKey($driver->motoristaId)->lockForUpdate()->firstOrFail();
            abort_if(
                CorridaModel::where('motoristaId', $driver->motoristaId)
                    ->whereIn('status', ['Aceita', 'MotoristaChegando', 'EmAndamento'])
                    ->exists(),
                409,
                'Finalize ou cancele sua corrida ativa antes de aceitar outra.',
            );
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

        $passengerUserId = PassageiroModel::whereKey($ride->passageiroId)->value('userId');
        app(ExpoPushService::class)->queueUsers($passengerUserId ? [(int) $passengerUserId] : []);

        return response()->json(['message' => 'Corrida aceita.', 'corrida' => $this->ridePayload($ride)]);
    }

    public function recusar(Request $request, int $corrida): JsonResponse
    {
        $driver = $this->approvedDriver($request);
        DB::transaction(function () use ($corrida, $driver): void {
            $ride = CorridaModel::whereKey($corrida)->lockForUpdate()->firstOrFail();
            abort_unless($ride->status === 'Solicitada' && $ride->motoristaId === null, 409, 'Esta solicitação já foi aceita ou encerrada.');
            abort_unless(
                VeiculoModel::where('motoristaId', $driver->motoristaId)->where('categoria', $ride->categoria)->exists(),
                422,
                'Você não possui veículo compatível com esta categoria.',
            );

            DB::table('tbCorridaRecusada')->insertOrIgnore([
                'corridaId' => $ride->corridaId,
                'motoristaId' => $driver->motoristaId,
                'dataRecusa' => now(),
            ]);
        });

        Log::info('Motorista recusou oferta de corrida.', [
            'corridaId' => $corrida,
            'motoristaId' => $driver->motoristaId,
        ]);

        return response()->json(['message' => 'Solicitação recusada. Ela continuará disponível para outros motoristas.']);
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

        $this->notifyRideParticipants($ride);

        return response()->json(['message' => 'Corrida finalizada.', 'corrida' => $this->ridePayload($ride)]);
    }

    public function cancelar(Request $request, int $corrida): JsonResponse
    {
        $data = $request->validate(['motivoCancelamento' => ['required', 'string', 'min:3', 'max:255']]);
        $ride = DB::transaction(function () use ($request, $corrida, $data): CorridaModel {
            $ride = CorridaModel::whereKey($corrida)->lockForUpdate()->firstOrFail();
            $this->assertParticipant($request, $ride);
            abort_unless(in_array($ride->status, ['Solicitada', 'Aceita', 'MotoristaChegando', 'EmAndamento'], true), 409, 'Esta corrida não pode mais ser cancelada.');

            $ride->status = 'Cancelada';
            $ride->motivoCancelamento = $data['motivoCancelamento'] ?? null;
            $ride->dataFim = now();
            $ride->save();
            DB::table('tbCorridaPosicao')->where('corridaId', $ride->corridaId)->delete();
            DB::table('tbLocalizacao')->where('corridaId', $ride->corridaId)->delete();
            if ($ride->corridaAgendadaId) {
                CorridaAgendadaModel::whereKey($ride->corridaAgendadaId)->update(['status' => 'Cancelada']);
            }

            return $ride;
        });

        Log::info('Corrida cancelada.', [
            'corridaId' => $ride->corridaId,
            'status' => $ride->status,
            'ator' => PassageiroModel::where('userId', $request->user()->userId)->exists() ? 'Passageiro' : 'Motorista',
        ]);
        $this->notifyRideParticipants($ride, [$request->user()->userId]);

        return response()->json(['message' => 'Corrida cancelada.', 'corrida' => $this->ridePayload($ride)]);
    }

    public function incidentes(Request $request, int $corrida): JsonResponse
    {
        $ride = CorridaModel::findOrFail($corrida);
        $this->assertParticipant($request, $ride);
        $incidents = DB::table('tbIncidenteCorrida')->where('corridaId', $ride->corridaId)
            ->orderBy('dataHora')->get(['incidenteId', 'categoria', 'descricao', 'reportadoPor', 'dataHora']);

        return response()->json(['incidentes' => $incidents]);
    }

    public function registrarIncidente(Request $request, int $corrida): JsonResponse
    {
        $data = $request->validate([
            'categoria' => ['required', Rule::in(['Veiculo', 'Rota', 'Emergencia', 'Outro'])],
            'descricao' => ['required', 'string', 'min:3', 'max:1000'],
        ]);
        [$ride, $passenger, $incidentId] = DB::transaction(function () use ($request, $corrida, $data): array {
            $ride = CorridaModel::whereKey($corrida)->lockForUpdate()->firstOrFail();
            $this->assertParticipant($request, $ride);
            abort_unless($ride->status === 'EmAndamento', 409, 'Incidentes podem ser registrados enquanto a corrida estiver em andamento.');
            $passenger = PassageiroModel::where('userId', $request->user()->userId)->first();
            $incidentId = DB::table('tbIncidenteCorrida')->insertGetId([
                'corridaId' => $ride->corridaId,
                'categoria' => $data['categoria'],
                'descricao' => $data['descricao'],
                'reportadoPor' => $passenger ? 'Passageiro' : 'Motorista',
                'dataHora' => now(),
            ], 'incidenteId');

            return [$ride, $passenger, $incidentId];
        });

        Log::info('Incidente registrado em corrida.', [
            'incidenteId' => $incidentId,
            'corridaId' => $ride->corridaId,
            'reportadoPor' => $passenger ? 'Passageiro' : 'Motorista',
        ]);

        return response()->json([
            'message' => 'Incidente registrado.',
            'incidente' => DB::table('tbIncidenteCorrida')->where('incidenteId', $incidentId)
                ->first(['incidenteId', 'categoria', 'descricao', 'reportadoPor', 'dataHora']),
        ], 201);
    }

    public function pagar(Request $request, int $corrida): JsonResponse
    {
        $passenger = $this->passenger($request);
        $data = $request->validate([
            'formaPagamento' => ['required', Rule::in(RideCatalog::paymentMethodValues())],
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
            'pagamento' => [
                'pagamentoId' => $payment->pagamentoId,
                'valorPago' => $payment->valorPago,
                'formaPagamento' => $payment->formaPagamento,
                'dataPagamento' => $payment->dataPagamento,
                'statusPagamento' => $payment->statusPagamento,
            ],
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

        Log::info('Avaliação de corrida registrada.', [
            'corridaId' => $ride->corridaId,
            'avaliacaoId' => $rating->avaliacaoId,
            'avaliadoPor' => $role,
            'nota' => $rating->nota,
        ]);

        return response()->json([
            'message' => 'Avaliação registrada.',
            'avaliacao' => [
                'avaliacaoId' => $rating->avaliacaoId,
                'nota' => $rating->nota,
                'comentario' => $rating->comentario,
                'dataAvaliacao' => $rating->dataAvaliacao,
            ],
        ], 201);
    }

    public function denunciar(Request $request, int $corrida): JsonResponse
    {
        $data = $request->validate([
            'motivo' => ['required', Rule::in(['Seguranca', 'Conduta', 'Veiculo', 'Rota', 'Outro'])],
            'descricao' => ['nullable', 'string', 'max:1000'],
        ]);
        $ride = CorridaModel::findOrFail($corrida);
        abort_unless(in_array($ride->status, ['Finalizada', 'Cancelada'], true), 409, 'A denúncia pode ser feita depois que a corrida for encerrada.');

        $passenger = PassageiroModel::findOrFail($ride->passageiroId);
        $driver = $ride->motoristaId ? MotoristaModel::findOrFail($ride->motoristaId) : null;
        $userId = $request->user()->userId;
        if ($passenger->userId === $userId && $driver) {
            $reporterRole = 'Passageiro';
            $accusedUserId = $driver->userId;
        } elseif ($driver && $driver->userId === $userId) {
            $reporterRole = 'Motorista';
            $accusedUserId = $passenger->userId;
        } else {
            abort(403, 'Somente quem participou da corrida pode registrar uma denúncia.');
        }

        try {
            $reportId = DB::table('tbDenunciaCorrida')->insertGetId([
                'corridaId' => $ride->corridaId,
                'denuncianteUserId' => $userId,
                'denunciadoUserId' => $accusedUserId,
                'reportadoPor' => $reporterRole,
                'motivo' => $data['motivo'],
                'descricao' => $data['descricao'] ?? null,
                'dataHora' => now(),
            ], 'denunciaId');
        } catch (QueryException $exception) {
            $databaseMessage = strtolower($exception->getMessage());
            if (str_contains($databaseMessage, 'uk_denuncia_corrida_usuario')
                || str_contains($databaseMessage, 'unique constraint')
                || str_contains($databaseMessage, 'duplicate entry')) {
                abort(409, 'Você já registrou uma denúncia para esta corrida.');
            }
            throw $exception;
        }

        Log::info('Denúncia vinculada a corrida registrada.', [
            'denunciaId' => $reportId,
            'corridaId' => $ride->corridaId,
            'reportadoPor' => $reporterRole,
        ]);

        return response()->json([
            'message' => 'Denúncia registrada para análise.',
            'denuncia' => DB::table('tbDenunciaCorrida')->where('denunciaId', $reportId)
                ->first(['denunciaId', 'corridaId', 'motivo', 'descricao', 'dataHora']),
        ], 201);
    }

    public function denunciasRecebidas(Request $request): JsonResponse
    {
        $reports = DB::table('tbDenunciaCorrida as denuncia')
            ->join('tbCorrida as corrida', 'corrida.corridaId', '=', 'denuncia.corridaId')
            ->where('denuncia.denunciadoUserId', $request->user()->userId)
            ->orderByDesc('denuncia.dataHora')
            ->get([
                'denuncia.denunciaId', 'denuncia.corridaId', 'denuncia.motivo',
                'denuncia.descricao', 'denuncia.reportadoPor', 'denuncia.dataHora', 'corrida.status as statusCorrida',
            ]);

        return response()->json(['denuncias' => $reports]);
    }

    public function localizar(Request $request, int $corrida): JsonResponse
    {
        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);
        $ride = CorridaModel::findOrFail($corrida);
        $userId = $request->user()->userId;
        $passenger = PassageiroModel::where('userId', $userId)->where('status', 'Ativo')->first();

        if ($passenger) {
            abort_unless($ride->passageiroId === $passenger->passageiroId, 403);
            abort_unless($ride->status === 'EmAndamento', 409, 'A localização do passageiro só é compartilhada durante a corrida.');
            $type = 'Passageiro';
        } else {
            $driver = $this->approvedDriver($request);
            abort_unless($ride->motoristaId === $driver->motoristaId, 403);
            abort_unless(in_array($ride->status, ['Aceita', 'MotoristaChegando', 'EmAndamento'], true), 409, 'Não há corrida ativa para atualizar a localização.');
            $type = 'Motorista';
        }

        $position = [
            'corridaId' => $ride->corridaId,
            'tipo' => $type,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'dataHora' => now(),
        ];
        DB::table('tbCorridaPosicao')->updateOrInsert(
            ['corridaId' => $ride->corridaId, 'tipo' => $type],
            ['latitude' => $data['latitude'], 'longitude' => $data['longitude'], 'dataHora' => $position['dataHora']],
        );

        return response()->json($position, 201);
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

        if (in_array($to, ['MotoristaChegando', 'EmAndamento'], true)) {
            $passengerUserId = PassageiroModel::whereKey($ride->passageiroId)->value('userId');
            app(ExpoPushService::class)->queueUsers($passengerUserId ? [(int) $passengerUserId] : []);
        }

        return response()->json(['message' => 'Status da corrida atualizado.', 'corrida' => $this->ridePayload($ride)]);
    }

    private function notifyRideParticipants(CorridaModel $ride, array $excludeUserIds = []): void
    {
        $userIds = array_filter([
            PassageiroModel::whereKey($ride->passageiroId)->value('userId'),
            $ride->motoristaId ? MotoristaModel::whereKey($ride->motoristaId)->value('userId') : null,
        ]);
        $userIds = array_values(array_diff(array_map('intval', $userIds), array_map('intval', $excludeUserIds)));
        app(ExpoPushService::class)->queueUsers($userIds);
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
        $driverPosition = DB::table('tbCorridaPosicao')
            ->where('corridaId', $ride->corridaId)->where('tipo', 'Motorista')->first();
        if (! $driverPosition) {
            $driverPosition = DB::table('tbLocalizacao')
                ->where('corridaId', $ride->corridaId)->orderByDesc('dataHora')->first();
        }
        $passengerPosition = DB::table('tbCorridaPosicao')
            ->where('corridaId', $ride->corridaId)->where('tipo', 'Passageiro')->first();

        return PublicRidePayloadResource::make([
            'corrida' => $ride,
            'motorista' => $driver,
            'agendamento' => $ride->corridaAgendadaId
                ? CorridaAgendadaModel::find($ride->corridaAgendadaId)
                : null,
            'pagamento' => PagamentoModel::where('corridaId', $ride->corridaId)->first(),
            'localizacao' => $driverPosition,
            'localizacaoMotorista' => $driverPosition,
            'localizacaoPassageiro' => $passengerPosition,
        ])->resolve(request());
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
