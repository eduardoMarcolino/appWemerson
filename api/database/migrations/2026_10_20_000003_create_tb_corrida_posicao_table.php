<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbCorridaPosicao', function (Blueprint $table): void {
            $table->increments('posicaoId');
            $table->unsignedInteger('corridaId');
            $table->enum('tipo', ['Motorista', 'Passageiro']);
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->dateTime('dataHora');
            $table->unique(['corridaId', 'tipo'], 'uk_corrida_posicao_participante');
            $table->foreign('corridaId', 'fk_corrida_posicao_corrida')
                ->references('corridaId')->on('tbCorrida')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('dataHora', 'idx_corrida_posicao_data_hora');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbCorridaPosicao');
    }
};
