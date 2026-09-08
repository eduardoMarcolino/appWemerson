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
        Schema::create('tbPassageiro', function (Blueprint $table) {
            $table->increments('passageiroId');
            $table->unsignedInteger('userId')->unique();
            $table->enum('status', ['Ativo', 'Inativo'])->default('Ativo');
            $table->foreign('userId', 'fk_passageiro_user')->references('userId')->on('tbUser')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbPassageiro');
    }
};
