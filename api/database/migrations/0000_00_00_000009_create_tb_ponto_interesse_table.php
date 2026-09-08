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
        Schema::create('tbPontoInteresse', function (Blueprint $table) {
            $table->increments('pontoInteresseId');
            $table->unsignedInteger('administradorId')->nullable();
            $table->string('nome', 100);
            $table->string('descricao', 255)->nullable();
            $table->enum('categoria', ['Hospital', 'Escola', 'Faculdade', 'Comercio', 'Transporte', 'Praca', 'Prefeitura', 'Saude', 'Outro'])->default('Outro');
            $table->string('logradouro', 150)->nullable();
            $table->string('numero', 10)->nullable();
            $table->string('bairro', 100)->nullable();
            $table->string('cidade', 100)->nullable();
            $table->char('estado', 2)->nullable();
            $table->string('cep', 9)->nullable();
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->boolean('pontoEmbarque')->default(false);
            $table->enum('status', ['Ativo', 'Inativo'])->default('Ativo');
            $table->foreign('administradorId', 'fk_ponto_interesse_admin')->references('administradorId')->on('tbAdministrador')->nullOnDelete()->cascadeOnUpdate();
            $table->index('cidade', 'idx_ponto_interesse_cidade');
            $table->index('categoria', 'idx_ponto_interesse_categoria');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbPontoInteresse');
    }
};
