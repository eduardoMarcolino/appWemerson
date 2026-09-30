<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PassageiroModel extends Model
{
    use HasFactory;

    protected $table = 'tbPassageiro';          // Nome exato da tabela
    protected $primaryKey = 'passageiroId';     // Nome exato da chave primária que está no banco
    public $timestamps = false;                 // Caso sua tabela não use created_at/updated_at
    
    protected $fillable = [
        'userId',
        'status'
    ];
}
