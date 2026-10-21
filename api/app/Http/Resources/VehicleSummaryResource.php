<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleSummaryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'veiculoId' => $this->veiculoId,
            'marca' => $this->marca,
            'modelo' => $this->modelo,
            'placa' => $this->placa,
            'cor' => $this->cor,
            'categoria' => $this->categoria,
        ];
    }
}
