<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbExpoPushToken', function (Blueprint $table): void {
            $table->increments('pushTokenId');
            $table->unsignedInteger('userId');
            $table->string('expoPushToken', 255)->unique();
            $table->enum('platform', ['android', 'ios']);
            $table->dateTime('dataRegistro');
            $table->dateTime('atualizadoEm');
            $table->index('userId');
            $table->foreign('userId')->references('userId')->on('tbUser')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbExpoPushToken');
    }
};
