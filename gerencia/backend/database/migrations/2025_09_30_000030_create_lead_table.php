<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('led_id');
            $table->unsignedBigInteger('led_ctaid');
            $table->unsignedBigInteger('led_iwhid')->nullable();
            $table->unsignedBigInteger('led_responsavel_usrid')->nullable();
            $table->string('led_nome');
            $table->string('led_telefone')->nullable();
            $table->string('led_email')->nullable();
            $table->string('led_status')->default('novo');
            $table->decimal('led_status_conf', 5, 2)->default(0);
            $table->string('led_etapa')->default('novo');
            $table->decimal('led_valor_total', 12, 2)->nullable();
            $table->string('led_origem')->nullable();
            $table->text('led_observacoes')->nullable();
            $table->timestamp('led_ultima_atualizacao_ia')->nullable();
            $table->timestamps();

            $table->foreign('led_ctaid', 'fk_led_cta')->references('cta_id')->on('conta')->cascadeOnDelete();
            $table->foreign('led_iwhid', 'fk_led_iwh')->references('iwh_id')->on('instancia_whatsapp')->nullOnDelete();
            $table->foreign('led_responsavel_usrid', 'fk_led_usr')->references('usr_id')->on('usuario')->nullOnDelete();

            $table->index(['led_ctaid'], 'ix_led_ctaid');
            $table->index(['led_status'], 'ix_led_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead');
    }
};
