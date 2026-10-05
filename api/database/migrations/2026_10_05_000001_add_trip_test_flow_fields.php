<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbCorrida', function (Blueprint $table): void {
            $table->string('categoria', 30)->default('Economico');
        });

        Schema::table('tbAvaliacao', function (Blueprint $table): void {
            $table->dropUnique(['corridaId']);
            $table->enum('avaliadoPor', ['Passageiro', 'Motorista'])->default('Passageiro');
            $table->unique(['corridaId', 'avaliadoPor'], 'uk_avaliacao_corrida_avaliador');
        });
    }

    public function down(): void
    {
        Schema::table('tbAvaliacao', function (Blueprint $table): void {
            $table->dropUnique('uk_avaliacao_corrida_avaliador');
            $table->dropColumn('avaliadoPor');
            $table->unique('corridaId', 'tbAvaliacao_corridaId_unique');
        });

        Schema::table('tbCorrida', function (Blueprint $table): void {
            $table->dropColumn('categoria');
        });
    }
};
