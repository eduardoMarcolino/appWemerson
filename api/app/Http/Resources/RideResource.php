<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RideResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'corridaId' => $this->corridaId,
            'origem' => $this->origem,
            'latitudeOrigem' => $this->latitudeOrigem,
            'longitudeOrigem' => $this->longitudeOrigem,
            'destino' => $this->destino,
            'latitudeDestino' => $this->latitudeDestino,
            'longitudeDestino' => $this->longitudeDestino,
            'categoria' => $this->categoria,
            'distanciaKm' => $this->distanciaKm,
            'valorCorrida' => $this->valorCorrida,
            'beneficiarioNome' => $this->beneficiarioNome,
            'dataSolicitacao' => $this->dataSolicitacao,
            'dataInicio' => $this->dataInicio,
            'dataFim' => $this->dataFim,
            'status' => $this->status,
            'motivoCancelamento' => $this->motivoCancelamento,
        ];
    }
}
