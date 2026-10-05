<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnderecoModel extends Model
{
    use HasFactory;

    protected $table = 'tbEndereco';

    public $timestamps = false;

    protected $fillable = [
        'userId',
        'logradouro',
        'numero',
        'bairro',
        'cidade',
        'estado',
        'cep',
        'complemento',
    ];
}
