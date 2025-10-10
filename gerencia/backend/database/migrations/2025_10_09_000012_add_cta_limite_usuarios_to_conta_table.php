<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conta', function (Blueprint $table) {
            $table->integer('cta_limite_usuarios')->default(5)->after('cta_limite_instancias');
        });
    }

    public function down(): void
    {
        Schema::table('conta', function (Blueprint $table) {
            $table->dropColumn('cta_limite_usuarios');
        });
    }
};

