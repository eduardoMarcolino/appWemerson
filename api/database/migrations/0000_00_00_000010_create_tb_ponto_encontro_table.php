<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbPontoEncontro', function (Blueprint $table) {
            $table->increments('pontoEncontroId');
            $table->unsignedInteger('passageiroId');
            $table->string('nome', 100);
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->string('descricao', 255)->nullable();
            $table->string('cidade', 100);
            $table->foreign('passageiroId', 'fk_ponto_encontro_passageiro')->references('passageiroId')->on('tbPassageiro')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbPontoEncontro');
    }
};
