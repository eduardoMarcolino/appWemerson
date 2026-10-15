<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PontoInteresseModel extends Model
{
    use HasFactory;

    protected $table = 'tbPontoInteresse';

    protected $primaryKey = 'pontoInteresseId';

    public $timestamps = false;
}
