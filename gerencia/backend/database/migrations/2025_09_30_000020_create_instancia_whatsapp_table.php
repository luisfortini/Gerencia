<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instancia_whatsapp', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('iwh_id');
            $table->unsignedBigInteger('iwh_ctaid');
            $table->string('iwh_nome');
            $table->string('iwh_status')->default('ativo');
            $table->string('iwh_api_key');
            $table->string('iwh_webhook_token')->unique('uq_iwh_webhook_token');
            $table->json('iwh_metadata')->nullable();
            $table->timestamps();

            $table->foreign('iwh_ctaid', 'fk_iwh_cta')->references('cta_id')->on('conta')->cascadeOnDelete();
            $table->index(['iwh_ctaid'], 'ix_iwh_ctaid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instancia_whatsapp');
    }
};
