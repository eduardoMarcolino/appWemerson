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
        Schema::create('tbVeiculo', function (Blueprint $table) {
            $table->increments('veiculoId');
            $table->unsignedInteger('motoristaId');
            $table->string('marca', 50);
            $table->string('modelo', 50);
            $table->string('placa', 10)->unique();
            $table->string('cor', 30)->nullable();
            $table->year('anoFabricacao')->nullable();
            $table->year('anoModelo')->nullable();
            $table->enum('categoria', ['Economico', 'Comfort', 'SUV', 'Moto'])->default('Economico');
            $table->foreign('motoristaId', 'fk_veiculo_motorista')->references('motoristaId')->on('tbMotorista')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbVeiculo');
    }
};
