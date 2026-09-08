<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbEnderecoFavorito', function (Blueprint $table) {
            $table->increments('enderecoFavoritoId');
            $table->unsignedInteger('userId');
            $table->string('nome', 100);
            $table->string('endereco', 255);
            $table->enum('tipo', ['Casa', 'Trabalho', 'Escola', 'Hospital', 'Outro'])->default('Outro');
            $table->foreign('userId', 'fk_endereco_favorito_user')->references('userId')->on('tbUser')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbEnderecoFavorito');
    }
};
