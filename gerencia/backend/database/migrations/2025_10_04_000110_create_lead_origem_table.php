<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_origem', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('lor_id');
            $table->unsignedBigInteger('lor_ctaid');
            $table->string('lor_nome', 150);
            $table->string('lor_slug', 160);
            $table->boolean('lor_padrao')->default(false);
            $table->timestamps();

            $table->foreign('lor_ctaid', 'fk_lor_cta')
                ->references('cta_id')
                ->on('conta')
                ->cascadeOnDelete();

            $table->unique(['lor_ctaid', 'lor_slug'], 'ux_lor_cta_slug');
            $table->index(['lor_ctaid', 'lor_padrao'], 'ix_lor_cta_padrao');
        });

        if (Schema::hasTable('conta')) {
            $defaults = [
                'Instagram',
                'Facebook',
                'Google',
                'Meta Ads',
                'Google Ads',
                'Site',
            ];

            $now = now();

            DB::table('conta')->pluck('cta_id')->each(function ($ctaId) use ($defaults, $now) {
                foreach ($defaults as $index => $nome) {
                    DB::table('lead_origem')->insert([
                        'lor_ctaid' => $ctaId,
                        'lor_nome' => $nome,
                        'lor_slug' => Str::slug($nome),
                        'lor_padrao' => $index === 0,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_origem');
    }
};