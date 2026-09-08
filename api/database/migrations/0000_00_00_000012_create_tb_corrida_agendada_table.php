<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbCorridaAgendada', function (Blueprint $table) {
            $table->increments('corridaAgendadaId');
            $table->unsignedInteger('passageiroId');
            $table->unsignedInteger('motoristaId')->nullable();
            $table->unsignedInteger('pontoEncontroId')->nullable();
            $table->string('origem', 255);
            $table->string('destino', 255);
            $table->dateTime('dataHora');
            $table->enum('status', ['Agendada', 'Confirmada', 'EmAndamento', 'Concluida', 'Cancelada'])->default('Agendada');
            $table->foreign('passageiroId', 'fk_corrida_agendada_passageiro')->references('passageiroId')->on('tbPassageiro')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreign('motoristaId', 'fk_corrida_agendada_motorista')->references('motoristaId')->on('tbMotorista')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('pontoEncontroId', 'fk_corrida_agendada_ponto_encontro')->references('pontoEncontroId')->on('tbPontoEncontro')->nullOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbCorridaAgendada');
    }
};
