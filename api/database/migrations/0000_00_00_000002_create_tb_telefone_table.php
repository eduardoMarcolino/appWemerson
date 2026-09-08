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
        Schema::create('tbTelefone', function (Blueprint $table) {
            $table->increments('telefoneId');
            $table->unsignedInteger('userId');
            $table->string('numeroTelefone', 20);
            $table->foreign('userId', 'fk_telefone_user')->references('userId')->on('tbUser')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbTelefone');
    }
};
