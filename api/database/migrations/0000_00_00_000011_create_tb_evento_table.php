<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbEvento', function (Blueprint $table) {
            $table->increments('eventoId');
            $table->unsignedInteger('administradorId')->nullable();
            $table->string('nome', 150);
            $table->string('descricao', 255)->nullable();
            $table->string('local', 255);
            $table->dateTime('dataInicio');
            $table->dateTime('dataFim');
            $table->string('categoria', 100);
            $table->string('cidade', 100);
            $table->boolean('ativo')->default(true);
            $table->foreign('administradorId', 'fk_evento_admin')->references('administradorId')->on('tbAdministrador')->nullOnDelete()->cascadeOnUpdate();
            $table->index('categoria', 'idx_evento_categoria');
            $table->index('cidade', 'idx_evento_cidade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbEvento');
    }
};
