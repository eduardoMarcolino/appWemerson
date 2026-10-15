<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventoModel extends Model
{
    protected $table = 'tbEvento';

    protected $primaryKey = 'eventoId';

    public $timestamps = false;

    protected $fillable = [
        'administradorId',
        'nome',
        'descricao',
        'local',
        'dataInicio',
        'dataFim',
        'categoria',
        'cidade',
        'ativo',
    ];

    protected function casts(): array
    {
        return [
            'dataInicio' => 'datetime',
            'dataFim' => 'datetime',
            'ativo' => 'boolean',
        ];
    }
}
