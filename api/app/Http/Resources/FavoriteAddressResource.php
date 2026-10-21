<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FavoriteAddressResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'enderecoFavoritoId' => $this->enderecoFavoritoId,
            'nome' => $this->nome,
            'endereco' => $this->endereco,
            'tipo' => $this->tipo,
        ];
    }
}
