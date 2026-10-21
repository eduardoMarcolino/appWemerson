<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbCorridaRecusada', function (Blueprint $table): void {
            $table->unsignedInteger('corridaId');
            $table->unsignedInteger('motoristaId');
            $table->dateTime('dataRecusa');
            $table->primary(['corridaId', 'motoristaId'], 'pk_corrida_recusada');
            $table->foreign('corridaId', 'fk_corrida_recusada_corrida')
                ->references('corridaId')->on('tbCorrida')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreign('motoristaId', 'fk_corrida_recusada_motorista')
                ->references('motoristaId')->on('tbMotorista')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbCorridaRecusada');
    }
};
