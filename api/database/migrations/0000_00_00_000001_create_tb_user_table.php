<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tbUser', function (Blueprint $table) {
            $table->increments('userId');
            $table->string('nome', 100);
            $table->string('email', 150)->unique();
            $table->string('senha', 255);
            $table->char('cpf', 11)->unique();
            $table->string('fotoPerfil', 255)->nullable();
            $table->dateTime('dataCadastro')->useCurrent();
            $table->enum('statusConta', ['Ativa', 'Inativa', 'Bloqueada'])->default('Ativa');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbUser');
    }
};
