<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MotoristaModel extends Model
{
    use HasFactory;

    protected $table = 'tbMotorista';

    protected $primaryKey = 'motoristaId';

    public $timestamps = false;

    protected $fillable = [
        'userId',
        'cnh',
        'validadeCNH',
        'avaliacaoMedia',
        'statusMotorista',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'userId', 'userId');
    }

    public function veiculos(): HasMany
    {
        return $this->hasMany(VeiculoModel::class, 'motoristaId', 'motoristaId');
    }

    public function corridas(): HasMany
    {
        return $this->hasMany(CorridaModel::class, 'motoristaId', 'motoristaId');
    }
}
