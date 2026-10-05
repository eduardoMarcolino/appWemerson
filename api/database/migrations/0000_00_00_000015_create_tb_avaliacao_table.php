<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tbAvaliacao', function (Blueprint $table) {
            $table->increments('avaliacaoId');
            $table->unsignedInteger('corridaId')->unique();
            $table->unsignedInteger('passageiroId');
            $table->unsignedInteger('motoristaId');
            $table->unsignedTinyInteger('nota');
            $table->text('comentario')->nullable();
            $table->dateTime('dataAvaliacao')->useCurrent();
            $table->foreign('corridaId', 'fk_avaliacao_corrida')->references('corridaId')->on('tbCorrida')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreign('passageiroId', 'fk_avaliacao_passageiro')->references('passageiroId')->on('tbPassageiro')->cascadeOnUpdate();
            $table->foreign('motoristaId', 'fk_avaliacao_motorista')->references('motoristaId')->on('tbMotorista')->cascadeOnUpdate();
        });

        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE tbAvaliacao ADD CONSTRAINT chk_avaliacao_nota CHECK (nota BETWEEN 1 AND 5)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbAvaliacao');
    }
};
