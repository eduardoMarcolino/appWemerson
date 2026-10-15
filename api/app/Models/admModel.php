<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class admModel extends Model
{
    use HasFactory;

    protected $table = 'tbAdministrador';

    protected $primaryKey = 'administradorId';

    public $timestamps = false;

    protected $fillable = [
        'userId',
        'nivelAcesso',
    ];
}
