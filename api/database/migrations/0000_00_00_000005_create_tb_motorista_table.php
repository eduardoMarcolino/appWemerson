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
        Schema::create('tbMotorista', function (Blueprint $table) {
            $table->increments('motoristaId');
            $table->unsignedInteger('userId')->unique();
            $table->string('cnh', 20);
            $table->date('validadeCNH');
            $table->decimal('avaliacaoMedia', 3, 2)->default(0);
            $table->enum('statusMotorista', ['Pendente', 'Aprovado', 'Bloqueado'])->default('Pendente');
            $table->foreign('userId', 'fk_motorista_user')->references('userId')->on('tbUser')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbMotorista');
    }
};
