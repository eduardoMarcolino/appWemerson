<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CorridaAgendadaModel extends Model
{
    use HasFactory;

    protected $table = 'tbCorridaAgendada';

    protected $primaryKey = 'corridaAgendadaId';

    public $timestamps = false;

    protected $fillable = [
        'passageiroId',
        'motoristaId',
        'pontoEncontroId',
        'origem',
        'destino',
        'dataHora',
        'status',
    ];
}
