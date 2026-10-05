<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VeiculoModel extends Model
{
    use HasFactory;

    protected $table = 'tbVeiculo';

    protected $primaryKey = 'veiculoId';

    public $timestamps = false;

    protected $fillable = [
        'motoristaId',
        'marca',
        'modelo',
        'placa',
        'cor',
        'anoFabricacao',
        'anoModelo',
        'categoria',
    ];
}
