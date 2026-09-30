<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class admModel extends Model
{
    use HasFactory;

    protected $table = 'tbadministrador';
    protected $primaryKey = 'administradorId';

    public $timestamps = false;

    protected $fillable = [
        'userId',
        'nivelAcesso'
    ];
}
