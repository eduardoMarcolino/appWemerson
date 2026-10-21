<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterestPointResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'pontoInteresseId' => $this->pontoInteresseId,
            'nome' => $this->nome,
            'endereco' => $this->endereco,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'pontoEmbarque' => $this->pontoEmbarque,
        ];
    }
}
