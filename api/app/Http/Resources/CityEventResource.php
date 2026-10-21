<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CityEventResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'eventoId' => $this->eventoId,
            'nome' => $this->nome,
            'descricao' => $this->descricao,
            'local' => $this->local,
            'dataInicio' => $this->dataInicio,
            'dataFim' => $this->dataFim,
            'categoria' => $this->categoria,
            'cidade' => $this->cidade,
        ];
    }
}
