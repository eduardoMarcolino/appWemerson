<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbFavoritoMotorista', function (Blueprint $table) {
            $table->increments('favoritoId');
            $table->unsignedInteger('passageiroId');
            $table->unsignedInteger('motoristaId');
            $table->dateTime('dataFavoritado')->useCurrent();
            $table->foreign('passageiroId', 'fk_favorito_passageiro')->references('passageiroId')->on('tbPassageiro')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreign('motoristaId', 'fk_favorito_motorista')->references('motoristaId')->on('tbMotorista')->cascadeOnDelete()->cascadeOnUpdate();
            $table->unique(['passageiroId', 'motoristaId'], 'uk_favorito_passageiro_motorista');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbFavoritoMotorista');
    }
};
