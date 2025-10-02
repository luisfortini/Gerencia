<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fila_job', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('fjb_id');
            $table->string('fjb_tipo');
            $table->string('fjb_status')->default('pendente');
            $table->unsignedInteger('fjb_tentativas')->default(0);
            $table->json('fjb_payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fila_job');
    }
};
