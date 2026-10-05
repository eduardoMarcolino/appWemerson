<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LocalizacaoModel extends Model
{
    use HasFactory;

    protected $table = 'tbLocalizacao';

    protected $primaryKey = 'localizacaoId';

    public $timestamps = false;

    protected $fillable = [
        'corridaId',
        'motoristaId',
        'latitude',
        'longitude',
        'dataHora',
    ];
}
