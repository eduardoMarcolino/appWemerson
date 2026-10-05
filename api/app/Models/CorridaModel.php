<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CorridaModel extends Model
{
    use HasFactory;

    protected $table = 'tbCorrida';

    protected $primaryKey = 'corridaId';

    public $timestamps = false;

    protected $fillable = [
        'passageiroId',
        'motoristaId',
        'pontoOrigemId',
        'pontoEncontroId',
        'eventoId',
        'corridaAgendadaId',
        'enderecoFavoritoId',
        'origem',
        'latitudeOrigem',
        'longitudeOrigem',
        'destino',
        'latitudeDestino',
        'longitudeDestino',
        'categoria',
        'distanciaKm',
        'valorCorrida',
        'beneficiarioNome',
        'beneficiarioTelefone',
        'tokenCompartilhamento',
        'dataSolicitacao',
        'dataInicio',
        'dataFim',
        'status',
        'motivoCancelamento',
    ];

    public function agendamento(): BelongsTo
    {
        return $this->belongsTo(CorridaAgendadaModel::class, 'corridaAgendadaId', 'corridaAgendadaId');
    }
}
