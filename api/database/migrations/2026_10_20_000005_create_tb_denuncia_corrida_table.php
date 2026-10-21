<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbDenunciaCorrida', function (Blueprint $table): void {
            $table->increments('denunciaId');
            $table->unsignedInteger('corridaId');
            $table->unsignedInteger('denuncianteUserId');
            $table->unsignedInteger('denunciadoUserId');
            $table->enum('reportadoPor', ['Passageiro', 'Motorista']);
            $table->enum('motivo', ['Seguranca', 'Conduta', 'Veiculo', 'Rota', 'Outro']);
            $table->text('descricao')->nullable();
            $table->dateTime('dataHora');
            $table->unique(['corridaId', 'denuncianteUserId'], 'uk_denuncia_corrida_usuario');
            $table->index(['denunciadoUserId', 'dataHora'], 'idx_denuncia_recebida_data');
            $table->foreign('corridaId')->references('corridaId')->on('tbCorrida')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreign('denuncianteUserId')->references('userId')->on('tbUser')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreign('denunciadoUserId')->references('userId')->on('tbUser')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbDenunciaCorrida');
    }
};
