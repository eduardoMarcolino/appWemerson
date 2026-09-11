<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MotoristaModel extends Model
{
    use HasFactory;

    protected $table = 'tbmotorista';

    public $timestamps = false;
    protected $fillable = [
        'userId',
        'cnh',
        'validadeCNH',
        'avaliacaoMedia',
        'statusMotorista',
    ];
}
