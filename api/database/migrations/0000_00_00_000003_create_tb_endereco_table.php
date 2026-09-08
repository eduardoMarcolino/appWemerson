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
        Schema::create('tbEndereco', function (Blueprint $table) {
            $table->increments('enderecoId');
            $table->unsignedInteger('userId');
            $table->string('logradouro', 150);
            $table->string('numero', 10)->nullable();
            $table->string('bairro', 100)->nullable();
            $table->string('cidade', 100)->nullable();
            $table->char('estado', 2)->nullable();
            $table->string('cep', 9)->nullable();
            $table->string('complemento', 100)->nullable();
            $table->foreign('userId', 'fk_endereco_user')->references('userId')->on('tbUser')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbEndereco');
    }
};
