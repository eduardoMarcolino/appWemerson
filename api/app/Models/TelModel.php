<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TelModel extends Model
{
    use HasFactory;

    protected $table = 'tbtelefone';

    public $timestamps = false;
    protected $fillable = [
        'userId',
        'numeroTelefone'
    ];
}
