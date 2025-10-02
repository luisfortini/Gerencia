<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conta', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('cta_id');
            $table->string('cta_nome');
            $table->string('cta_slug')->unique('uq_cta_slug');
            $table->enum('cta_plano_tipo', ['mensal', 'anual'])->default('mensal');
            $table->integer('cta_limite_instancias')->default(1);
            $table->integer('cta_retencao_dias')->default(30);
            $table->string('cta_status')->default('ativo');
            $table->text('cta_observacoes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conta');
    }
};
