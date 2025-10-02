<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuario', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('usr_id');
            $table->unsignedBigInteger('usr_ctaid')->nullable();
            $table->string('usr_nome');
            $table->string('usr_email')->unique('uq_usr_email');
            $table->string('usr_senha');
            $table->string('usr_papel');
            $table->boolean('usr_superadmin')->default(false);
            $table->boolean('usr_ativo')->default(true);
            $table->rememberToken();
            $table->timestamps();

            $table->foreign('usr_ctaid', 'fk_usr_cta')->references('cta_id')->on('conta')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuario');
    }
};
