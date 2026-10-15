<?php

namespace App\Http\Controllers;

use App\Models\CorridaModel;
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
            || ($driver && $driver->statusMotorista === 'Bloqueado')) {
            $user->currentAccessToken()?->delete();
            abort(401, 'Esta conta não está mais ativa.');
        }

        $data = [
            'perfil' => [
                'telefones' => $user->telefones,
                'enderecos' => $user->enderecos,
            ],
            'eventos' => EventoModel::where('ativo', true)->where('dataFim', '>=', now())->orderBy('dataInicio')->get(),
            'pontosInteresse' => PontoInteresseModel::where('status', 'Ativo')->orderBy('nome')->get(),
            'pontosEmbarque' => PontoInteresseModel::where('status', 'Ativo')->where('pontoEmbarque', true)->orderBy('nome')->get(),
            'pontosEncontro' => $passenger
                ? PontoEncontroModel::where('passageiroId', $passenger->passageiroId)->orderBy('nome')->get()
                : [],
            'enderecosFavoritos' => $passenger
                ? EnderecoFavModel::where('userId', $user->userId)->orderBy('nome')->get()
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

        return response()->json($address, 201);
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

                return ['pagamento' => $payment, 'corrida' => $ride];
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
