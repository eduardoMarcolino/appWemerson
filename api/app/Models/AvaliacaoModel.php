<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AvaliacaoModel extends Model
{
    use HasFactory;

    protected $table = 'tbAvaliacao';

    protected $primaryKey = 'avaliacaoId';

    public $timestamps = false;

    protected $fillable = [
        'corridaId',
        'passageiroId',
        'motoristaId',
        'avaliadoPor',
        'nota',
        'comentario',
        'dataAvaliacao',
    ];
}
