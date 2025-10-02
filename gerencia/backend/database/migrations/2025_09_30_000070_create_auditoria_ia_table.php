<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auditoria_ia', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('aia_id');
            $table->unsignedBigInteger('aia_ledid');
            $table->json('aia_payload');
            $table->json('aia_resposta');
            $table->string('aia_provider');
            $table->string('aia_status');
            $table->timestamps();

            $table->foreign('aia_ledid', 'fk_aia_led')->references('led_id')->on('lead')->cascadeOnDelete();
            $table->index(['aia_ledid'], 'ix_aia_ledid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditoria_ia');
    }
};
