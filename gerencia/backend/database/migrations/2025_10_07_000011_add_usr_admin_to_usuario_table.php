<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->boolean('usr_admin')->default(false)->after('usr_superadmin');
        });
    }

    public function down(): void
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->dropColumn('usr_admin');
        });
    }
};
