<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnderecoFavModel extends Model
{
    use HasFactory;

    protected $table = 'tbEnderecoFavorito';

    protected $primaryKey = 'enderecoFavoritoId';

    public $timestamps = false;

    protected $fillable = ['userId', 'nome', 'endereco', 'tipo'];
}
