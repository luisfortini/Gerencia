<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('log_status_lead', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('lsl_id');
            $table->unsignedBigInteger('lsl_ledid');
            $table->string('lsl_status_anterior');
            $table->string('lsl_status_novo');
            $table->string('lsl_origem');
            $table->text('lsl_motivo')->nullable();
            $table->unsignedBigInteger('lsl_usrid')->nullable();
            $table->timestamps();

            $table->foreign('lsl_ledid', 'fk_lsl_led')->references('led_id')->on('lead')->cascadeOnDelete();
            $table->foreign('lsl_usrid', 'fk_lsl_usr')->references('usr_id')->on('usuario')->nullOnDelete();

            $table->index(['lsl_ledid'], 'ix_lsl_ledid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('log_status_lead');
    }
};
