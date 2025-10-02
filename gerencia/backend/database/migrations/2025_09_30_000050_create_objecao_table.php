<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('objecao', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('obj_id');
            $table->unsignedBigInteger('obj_ctaid')->nullable();
            $table->string('obj_nome');
            $table->enum('obj_tipo', ['base', 'custom'])->default('base');
            $table->boolean('obj_ativo')->default(true);
            $table->timestamps();

            $table->foreign('obj_ctaid', 'fk_obj_cta')->references('cta_id')->on('conta')->cascadeOnDelete();
            $table->unique(['obj_ctaid', 'obj_nome'], 'uq_obj_ctaid_nome');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('objecao');
    }
};
