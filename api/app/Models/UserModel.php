<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class UserModel extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'tbUser';

    protected $primaryKey = 'userId';

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

    protected $hidden = ['senha'];

    public function getAuthPasswordName(): string
    {
        return 'senha';
    }

    public function getAuthPassword(): string
    {
        return $this->senha;
    }

    public function passageiro(): HasOne
    {
        return $this->hasOne(PassageiroModel::class, 'userId', 'userId');
    }

    public function motorista(): HasOne
    {
        return $this->hasOne(MotoristaModel::class, 'userId', 'userId');
    }

    public function telefones(): HasMany
    {
        return $this->hasMany(TelModel::class, 'userId', 'userId');
    }

    public function enderecos(): HasMany
    {
        return $this->hasMany(EnderecoModel::class, 'userId', 'userId');
    }
}
