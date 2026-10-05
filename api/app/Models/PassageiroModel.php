<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PassageiroModel extends Model
{
    use HasFactory;

    protected $table = 'tbPassageiro';          // Nome exato da tabela

    protected $primaryKey = 'passageiroId';     // Nome exato da chave primária que está no banco

    public $timestamps = false;                 // Caso sua tabela não use created_at/updated_at

    protected $fillable = [
        'userId',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'userId', 'userId');
    }

    public function corridas(): HasMany
    {
        return $this->hasMany(CorridaModel::class, 'passageiroId', 'passageiroId');
    }
}
