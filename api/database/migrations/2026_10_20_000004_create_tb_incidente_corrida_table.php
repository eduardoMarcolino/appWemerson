<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbIncidenteCorrida', function (Blueprint $table): void {
            $table->bigIncrements('incidenteId');
            $table->unsignedInteger('corridaId');
            $table->enum('categoria', ['Veiculo', 'Rota', 'Emergencia', 'Outro']);
            $table->text('descricao')->nullable();
            $table->enum('reportadoPor', ['Passageiro', 'Motorista']);
            $table->dateTime('dataHora');
            $table->index(['corridaId', 'dataHora']);
            $table->foreign('corridaId')->references('corridaId')->on('tbCorrida')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbIncidenteCorrida');
    }
};
