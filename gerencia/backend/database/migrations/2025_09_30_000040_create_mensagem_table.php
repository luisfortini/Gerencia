<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mensagem', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('msg_id');
            $table->unsignedBigInteger('msg_ledid');
            $table->unsignedBigInteger('msg_iwhid');
            $table->string('msg_direcao');
            $table->text('msg_conteudo');
            $table->string('msg_msgid')->unique('uq_msg_msgid');
            $table->timestamp('msg_recebido_em');
            $table->timestamps();

            $table->foreign('msg_ledid', 'fk_msg_led')->references('led_id')->on('lead')->cascadeOnDelete();
            $table->foreign('msg_iwhid', 'fk_msg_iwh')->references('iwh_id')->on('instancia_whatsapp')->cascadeOnDelete();

            $table->index(['msg_ledid', 'msg_recebido_em'], 'ix_msg_ledid_msg_recebido_em');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mensagem');
    }
};
