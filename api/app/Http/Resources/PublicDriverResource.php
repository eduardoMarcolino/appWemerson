<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicDriverResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'motoristaId' => $this->motoristaId,
            'avaliacaoMedia' => $this->avaliacaoMedia,
            'user' => $this->whenLoaded('user', fn (): array => [
                'nome' => $this->user->nome,
                'fotoPerfil' => $this->user->fotoPerfil,
            ]),
            'veiculos' => VehicleSummaryResource::collection($this->whenLoaded('veiculos')),
        ];
    }
}
