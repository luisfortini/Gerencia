<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mensagem', function (Blueprint $table) {
            $table->string('msg_tipomidia', 20)->nullable()->after('msg_conteudo');
            $table->text('msg_urlmidia')->nullable()->after('msg_tipomidia');
            $table->string('msg_mimetype', 100)->nullable()->after('msg_urlmidia');
            $table->string('msg_sha256', 128)->nullable()->after('msg_mimetype');
            $table->integer('msg_tamanho')->nullable()->after('msg_sha256');
        });
    }

    public function down(): void
    {
        Schema::table('mensagem', function (Blueprint $table) {
            $table->dropColumn(['msg_tipomidia', 'msg_urlmidia', 'msg_mimetype', 'msg_sha256', 'msg_tamanho']);
        });
    }
};

