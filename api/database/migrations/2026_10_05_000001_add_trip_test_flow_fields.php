<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $foreignKey = Schema::getConnection()->getDriverName() === 'sqlite'
            ? ['corridaId']
            : 'fk_avaliacao_corrida';

        if (! Schema::hasColumn('tbCorrida', 'categoria')) {
            Schema::table('tbCorrida', function (Blueprint $table): void {
                $table->string('categoria', 30)->default('Economico');
            });
        }

        Schema::table('tbAvaliacao', function (Blueprint $table) use ($foreignKey): void {
            $table->dropForeign($foreignKey);
        });

        Schema::table('tbAvaliacao', function (Blueprint $table): void {
            $table->dropUnique('tbAvaliacao_corridaId_unique');
        });

        Schema::table('tbAvaliacao', function (Blueprint $table): void {
            $table->enum('avaliadoPor', ['Passageiro', 'Motorista'])->default('Passageiro');
            $table->unique(['corridaId', 'avaliadoPor'], 'uk_avaliacao_corrida_avaliador');
        });

        Schema::table('tbAvaliacao', function (Blueprint $table): void {
            $table->foreign('corridaId', 'fk_avaliacao_corrida')
                ->references('corridaId')
                ->on('tbCorrida')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        $foreignKey = Schema::getConnection()->getDriverName() === 'sqlite'
            ? ['corridaId']
            : 'fk_avaliacao_corrida';

        Schema::table('tbAvaliacao', function (Blueprint $table) use ($foreignKey): void {
            $table->dropForeign($foreignKey);
        });

        Schema::table('tbAvaliacao', function (Blueprint $table): void {
            $table->dropUnique('uk_avaliacao_corrida_avaliador');
            $table->dropColumn('avaliadoPor');
            $table->unique('corridaId', 'tbAvaliacao_corridaId_unique');
        });

        Schema::table('tbAvaliacao', function (Blueprint $table): void {
            $table->foreign('corridaId', 'fk_avaliacao_corrida')
                ->references('corridaId')
                ->on('tbCorrida')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });

        Schema::table('tbCorrida', function (Blueprint $table): void {
            $table->dropColumn('categoria');
        });
    }
};
