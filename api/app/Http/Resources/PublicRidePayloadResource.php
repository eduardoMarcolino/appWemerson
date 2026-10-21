<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicRidePayloadResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $driverLocation = $this['localizacaoMotorista'] ?? $this['localizacao'] ?? null;
        $passengerLocation = $this['localizacaoPassageiro'] ?? null;

        return [
            'corrida' => RideResource::make($this['corrida'])->resolve($request),
            'motorista' => $this['motorista']
                ? PublicDriverResource::make($this['motorista'])->resolve($request)
                : null,
            'agendamento' => $this['agendamento'] ? [
                'dataHora' => $this['agendamento']->dataHora,
                'status' => $this['agendamento']->status,
            ] : null,
            'pagamento' => $this['pagamento'] ? [
                'pagamentoId' => $this['pagamento']->pagamentoId,
                'valorPago' => $this['pagamento']->valorPago,
                'formaPagamento' => $this['pagamento']->formaPagamento,
                'dataPagamento' => $this['pagamento']->dataPagamento,
                'statusPagamento' => $this['pagamento']->statusPagamento,
            ] : null,
            // Mantém a chave localizacao para versões antigas dos dois apps.
            'localizacao' => $this->locationPayload($driverLocation),
            'localizacaoMotorista' => $this->locationPayload($driverLocation),
            'localizacaoPassageiro' => $this->locationPayload($passengerLocation),
        ];
    }

    private function locationPayload(mixed $location): ?array
    {
        return $location ? [
            'latitude' => $location->latitude,
            'longitude' => $location->longitude,
            'dataHora' => $location->dataHora,
        ] : null;
    }
}
