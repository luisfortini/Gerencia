<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mensagem', function (Blueprint $table) {
            $table->string('msg_msgtype', 50)->nullable()->after('msg_tipomidia');
            $table->text('msg_media_key')->nullable()->after('msg_mimetype');
        });
    }

    public function down(): void
    {
        Schema::table('mensagem', function (Blueprint $table) {
            $table->dropColumn(['msg_msgtype', 'msg_media_key']);
        });
    }
};
