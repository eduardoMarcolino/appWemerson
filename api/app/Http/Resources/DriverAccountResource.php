<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DriverAccountResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'motoristaId' => $this->motoristaId,
            'cnh' => $this->cnh,
            'validadeCNH' => $this->validadeCNH,
            'avaliacaoMedia' => $this->avaliacaoMedia,
            'statusMotorista' => $this->statusMotorista,
            'veiculos' => VehicleSummaryResource::collection($this->whenLoaded('veiculos')),
        ];
    }
}
