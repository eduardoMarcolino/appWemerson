<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountUserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'userId' => $this->userId,
            'nome' => $this->nome,
            'email' => $this->email,
            'cpf' => $this->cpf,
            'fotoPerfil' => $this->fotoPerfil,
            'statusConta' => $this->statusConta,
        ];
    }
}
