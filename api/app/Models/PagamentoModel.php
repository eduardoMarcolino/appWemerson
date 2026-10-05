<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PagamentoModel extends Model
{
    use HasFactory;

    protected $table = 'tbPagamento';

    protected $primaryKey = 'pagamentoId';

    public $timestamps = false;

    protected $fillable = [
        'corridaId',
        'valorPago',
        'formaPagamento',
        'dataPagamento',
        'statusPagamento',
    ];
}
