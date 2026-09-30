<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserModel extends Model
{
    use HasFactory;

    protected $table = 'tbuser';
    protected $primaryKey = 'id';

    public $timestamps = false;
    protected $fillable = [
        'nome',
        'email',
        'senha',
        'cpf',
        'fotoPerfil',
        'dataCadastro',
        'statusConta',
    ];
}
