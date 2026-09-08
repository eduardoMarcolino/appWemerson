<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbAdministrador', function (Blueprint $table) {
            $table->increments('administradorId');
            $table->unsignedInteger('userId')->unique();
            $table->enum('nivelAcesso', ['Master', 'Operador'])->default('Operador');
            $table->foreign('userId', 'fk_administrador_user')->references('userId')->on('tbUser')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbAdministrador');
    }
};
