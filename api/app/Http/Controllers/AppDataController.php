<?php

namespace App\Http\Controllers;

use App\Http\Resources\CityEventResource;
use App\Http\Resources\FavoriteAddressResource;
use App\Http\Resources\InterestPointResource;
use App\Http\Resources\PublicDriverResource;
use App\Http\Resources\RideResource;
use App\Models\CorridaModel;
use App\Models\AvaliacaoModel;
use App\Models\EnderecoFavModel;
use App\Models\EventoModel;
use App\Models\MotoristaFavoritoModel;
use App\Models\MotoristaModel;
use App\Models\PagamentoModel;
use App\Models\PassageiroModel;
use App\Models\PontoEncontroModel;
use App\Models\PontoInteresseModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppDataController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $passenger = PassageiroModel::where('userId', $user->userId)->where('status', 'Ativo')->first();
        $driver = MotoristaModel::where('userId', $user->userId)->first();
        if ($user->statusConta !== 'Ativa'
            || (! $passenger && ! $driver)
            || ($driver && $driver->statusMotorista !== 'Aprovado')) {
            $user->currentAccessToken()?->delete();
            abort(401, 'Esta conta não está mais ativa.');
        }

        $data = [
            'perfil' => [
                'avaliacaoMedia' => $passenger
                    ? (float) (AvaliacaoModel::whereIn('corridaId', CorridaModel::where('passageiroId', $passenger->passageiroId)->select('corridaId'))
                        ->where('avaliadoPor', 'Motorista')->avg('nota') ?? 0)
                    : (float) ($driver?->avaliacaoMedia ?? 0),
                'totalAvaliacoes' => $passenger
                    ? AvaliacaoModel::whereIn('corridaId', CorridaModel::where('passageiroId', $passenger->passageiroId)->select('corridaId'))
                        ->where('avaliadoPor', 'Motorista')->count()
                    : ($driver ? AvaliacaoModel::where('motoristaId', $driver->motoristaId)->where('avaliadoPor', 'Passageiro')->count() : 0),
                'telefones' => $user->telefones->map(fn ($phone): array => [
                    'telefoneId' => $phone->telefoneId,
                    'numeroTelefone' => $phone->numeroTelefone,
                ])->all(),
                'enderecos' => $user->enderecos->map(fn ($address): array => [
                    'enderecoId' => $address->enderecoId,
                    'logradouro' => $address->logradouro,
                    'numero' => $address->numero,
                    'complemento' => $address->complemento,
                    'bairro' => $address->bairro,
                    'cidade' => $address->cidade,
                    'estado' => $address->estado,
                    'cep' => $address->cep,
                ])->all(),
            ],
            'eventos' => CityEventResource::collection(
                EventoModel::where('ativo', true)->where('dataFim', '>=', now())->orderBy('dataInicio')->get(),
            )->resolve($request),
            'pontosInteresse' => InterestPointResource::collection(
                PontoInteresseModel::where('status', 'Ativo')->orderBy('nome')->get(),
            )->resolve($request),
            'pontosEmbarque' => InterestPointResource::collection(
                PontoInteresseModel::where('status', 'Ativo')->where('pontoEmbarque', true)->orderBy('nome')->get(),
            )->resolve($request),
            'pontosEncontro' => $passenger
                ? PontoEncontroModel::where('passageiroId', $passenger->passageiroId)->orderBy('nome')->get()
                    ->map(fn (PontoEncontroModel $point): array => [
                        'pontoEncontroId' => $point->pontoEncontroId,
                        'nome' => $point->nome,
                        'endereco' => $point->endereco,
                        'latitude' => $point->latitude,
                        'longitude' => $point->longitude,
                    ])->all()
                : [],
            'enderecosFavoritos' => $passenger
                ? FavoriteAddressResource::collection(
                    EnderecoFavModel::where('userId', $user->userId)->orderBy('nome')->get(),
                )->resolve($request)
                : [],
            'motoristasFavoritos' => $passenger
                ? $this->favoriteDrivers($passenger->passageiroId)
                : [],
            'pagamentos' => $passenger
                ? $this->passengerPayments($passenger->passageiroId)
                : [],
            'desempenho' => $driver ? $this->driverPerformance($driver) : null,
        ];

        return response()->json($data);
    }

    public function saveFavoriteAddress(Request $request): JsonResponse
    {
        $passenger = $this->passenger($request);
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:100'],
            'endereco' => ['required', 'string', 'max:255'],
            'tipo' => ['required', 'in:Casa,Trabalho,Escola,Hospital,Outro'],
        ]);
        $address = EnderecoFavModel::create([
            ...$data,
            'userId' => $request->user()->userId,
        ]);

        return response()->json(FavoriteAddressResource::make($address)->resolve($request), 201);
    }

    public function deleteFavoriteAddress(Request $request, int $id): JsonResponse
    {
        $this->passenger($request);
        $deleted = EnderecoFavModel::where('userId', $request->user()->userId)
            ->where('enderecoFavoritoId', $id)
            ->delete();
        abort_unless($deleted, 404, 'Endereço favorito não encontrado.');

        return response()->json(['message' => 'Endereço removido dos favoritos.']);
    }

    public function saveFavoriteDriver(Request $request, int $id): JsonResponse
    {
        $passenger = $this->passenger($request);
        abort_unless(MotoristaModel::where('motoristaId', $id)->where('statusMotorista', 'Aprovado')->exists(), 404);
        MotoristaFavoritoModel::firstOrCreate([
            'passageiroId' => $passenger->passageiroId,
            'motoristaId' => $id,
        ]);

        return response()->json(['message' => 'Motorista adicionado aos favoritos.'], 201);
    }

    public function deleteFavoriteDriver(Request $request, int $id): JsonResponse
    {
        $passenger = $this->passenger($request);
        $deleted = MotoristaFavoritoModel::where('passageiroId', $passenger->passageiroId)
            ->where('motoristaId', $id)
            ->delete();
        abort_unless($deleted, 404, 'Motorista favorito não encontrado.');

        return response()->json(['message' => 'Motorista removido dos favoritos.']);
    }

    private function passenger(Request $request): PassageiroModel
    {
        $passenger = PassageiroModel::where('userId', $request->user()->userId)->first();
        abort_unless($passenger && $passenger->status === 'Ativo', 403, 'Conta de passageiro indisponível.');

        return $passenger;
    }

    private function favoriteDrivers(int $passengerId): array
    {
        return MotoristaModel::with(['user', 'veiculos'])
            ->whereIn('motoristaId', MotoristaFavoritoModel::where('passageiroId', $passengerId)->select('motoristaId'))
            ->orderBy('motoristaId')
            ->get()
            ->map(fn (MotoristaModel $driver): array => PublicDriverResource::make($driver)->resolve(request()))
            ->all();
    }

    private function passengerPayments(int $passengerId): array
    {
        $rideIds = CorridaModel::where('passageiroId', $passengerId)->select('corridaId');

        return PagamentoModel::whereIn('corridaId', $rideIds)
            ->orderByDesc('dataPagamento')
            ->get()
            ->map(function (PagamentoModel $payment): array {
                $ride = CorridaModel::findOrFail($payment->corridaId);

                return [
                    'pagamento' => [
                        'pagamentoId' => $payment->pagamentoId,
                        'valorPago' => $payment->valorPago,
                        'formaPagamento' => $payment->formaPagamento,
                        'dataPagamento' => $payment->dataPagamento,
                        'statusPagamento' => $payment->statusPagamento,
                    ],
                    'corrida' => RideResource::make($ride)->resolve(request()),
                ];
            })
            ->all();
    }

    private function driverPerformance(MotoristaModel $driver): array
    {
        $rides = CorridaModel::where('motoristaId', $driver->motoristaId);
        $total = (clone $rides)->count();
        $finished = (clone $rides)->where('status', 'Finalizada')->count();
        $cancelled = (clone $rides)->where('status', 'Cancelada')->count();
        $considered = $finished + $cancelled;

        return [
            'avaliacaoMedia' => (float) $driver->avaliacaoMedia,
            'totalCorridas' => $total,
            'corridasFinalizadas' => $finished,
            'corridasCanceladas' => $cancelled,
            'taxaConclusao' => $considered > 0 ? round($finished * 100 / $considered) : 0,
        ];
    }
}
