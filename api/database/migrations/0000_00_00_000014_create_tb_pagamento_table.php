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
        Schema::create('tbPagamento', function (Blueprint $table) {
            $table->increments('pagamentoId');
            $table->unsignedInteger('corridaId')->unique();
            $table->decimal('valorPago', 10, 2);
            $table->enum('formaPagamento', ['Pix', 'Dinheiro', 'CartaoCredito', 'CartaoDebito', 'CarteiraDigital']);
            $table->dateTime('dataPagamento')->nullable();
            $table->enum('statusPagamento', ['Pendente', 'Pago', 'Cancelado'])->default('Pendente');
            $table->foreign('corridaId', 'fk_pagamento_corrida')->references('corridaId')->on('tbCorrida')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbPagamento');
    }
};
