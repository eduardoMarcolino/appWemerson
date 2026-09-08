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
        Schema::create('tbLocalizacao', function (Blueprint $table) {
            $table->bigIncrements('localizacaoId');
            $table->unsignedInteger('corridaId');
            $table->unsignedInteger('motoristaId');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->dateTime('dataHora')->useCurrent();
            $table->foreign('corridaId', 'fk_localizacao_corrida')->references('corridaId')->on('tbCorrida')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreign('motoristaId', 'fk_localizacao_motorista')->references('motoristaId')->on('tbMotorista')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('corridaId', 'idx_localizacao_corrida');
            $table->index('motoristaId', 'idx_localizacao_motorista');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbLocalizacao');
    }
};
