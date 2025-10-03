<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead', function (Blueprint $table) {
            if (! Schema::hasColumn('lead', 'led_data_nascimento')) {
                $table->date('led_data_nascimento')->nullable()->after('led_valor_total');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lead', function (Blueprint $table) {
            if (Schema::hasColumn('lead', 'led_data_nascimento')) {
                $table->dropColumn('led_data_nascimento');
            }
        });
    }
};