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
        Schema::create('tbCorrida', function (Blueprint $table) {
            $table->increments('corridaId');
            $table->unsignedInteger('passageiroId');
            $table->unsignedInteger('motoristaId')->nullable();
            $table->unsignedInteger('pontoOrigemId')->nullable();
            $table->unsignedInteger('pontoEncontroId')->nullable();
            $table->unsignedInteger('eventoId')->nullable();
            $table->unsignedInteger('corridaAgendadaId')->nullable();
            $table->unsignedInteger('enderecoFavoritoId')->nullable();
            $table->string('origem', 255);
            $table->decimal('latitudeOrigem', 10, 8);
            $table->decimal('longitudeOrigem', 11, 8);
            $table->string('destino', 255);
            $table->decimal('latitudeDestino', 10, 8);
            $table->decimal('longitudeDestino', 11, 8);
            $table->decimal('distanciaKm', 8, 2)->nullable();
            $table->decimal('valorCorrida', 10, 2)->nullable();
            $table->string('beneficiarioNome', 150)->nullable();
            $table->string('beneficiarioTelefone', 20)->nullable();
            $table->string('tokenCompartilhamento', 255)->nullable();
            $table->dateTime('dataSolicitacao')->useCurrent();
            $table->dateTime('dataInicio')->nullable();
            $table->dateTime('dataFim')->nullable();
            $table->enum('status', ['Solicitada', 'Aceita', 'MotoristaChegando', 'EmAndamento', 'Finalizada', 'Cancelada'])->default('Solicitada');
            $table->string('motivoCancelamento', 255)->nullable();
            $table->foreign('passageiroId', 'fk_corrida_passageiro')->references('passageiroId')->on('tbPassageiro')->cascadeOnUpdate();
            $table->foreign('motoristaId', 'fk_corrida_motorista')->references('motoristaId')->on('tbMotorista')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('pontoOrigemId', 'fk_corrida_ponto_interesse')->references('pontoInteresseId')->on('tbPontoInteresse')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('pontoEncontroId', 'fk_corrida_ponto_encontro')->references('pontoEncontroId')->on('tbPontoEncontro')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('eventoId', 'fk_corrida_evento')->references('eventoId')->on('tbEvento')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('corridaAgendadaId', 'fk_corrida_agendada')->references('corridaAgendadaId')->on('tbCorridaAgendada')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('enderecoFavoritoId', 'fk_corrida_endereco_favorito')->references('enderecoFavoritoId')->on('tbEnderecoFavorito')->nullOnDelete()->cascadeOnUpdate();
            $table->index('passageiroId', 'idx_corrida_passageiro');
            $table->index('motoristaId', 'idx_corrida_motorista');
            $table->index('status', 'idx_corrida_status');
            $table->index('pontoOrigemId', 'idx_corrida_ponto_origem');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbCorrida');
    }
};
