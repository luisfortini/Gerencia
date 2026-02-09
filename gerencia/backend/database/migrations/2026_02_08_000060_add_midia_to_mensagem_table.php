<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mensagem', function (Blueprint $table) {
            $table->longText('msg_midia')->nullable()->after('msg_media_key');
        });
    }

    public function down(): void
    {
        Schema::table('mensagem', function (Blueprint $table) {
            $table->dropColumn(['msg_midia']);
        });
    }
};
