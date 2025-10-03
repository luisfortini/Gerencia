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
        Schema::table('lead', function (Blueprint $table) {
            if (! Schema::hasColumn('lead', 'led_lorid')) {
                $table->unsignedBigInteger('led_lorid')->nullable()->after('led_origem');
                $table->foreign('led_lorid', 'fk_led_lor')
                    ->references('lor_id')
                    ->on('lead_origem')
                    ->nullOnDelete();
                $table->index('led_lorid', 'ix_led_lorid');
            }
        });

        $leads = DB::table('lead')->select('led_id', 'led_ctaid', 'led_origem')->get();

        foreach ($leads as $lead) {
            $nome = trim((string) ($lead->led_origem ?? ''));
            if ($nome === '') {
                continue;
            }

            $slug = Str::slug($nome) ?: Str::slug(Str::random(12));

            $origemId = DB::table('lead_origem')
                ->where('lor_ctaid', $lead->led_ctaid)
                ->where('lor_slug', $slug)
                ->value('lor_id');

            if (! $origemId) {
                $origemId = DB::table('lead_origem')->insertGetId([
                    'lor_ctaid' => $lead->led_ctaid,
                    'lor_nome' => $nome,
                    'lor_slug' => $slug,
                    'lor_padrao' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('lead')
                ->where('led_id', $lead->led_id)
                ->update(['led_lorid' => $origemId]);
        }
    }

    public function down(): void
    {
        Schema::table('lead', function (Blueprint $table) {
            if (Schema::hasColumn('lead', 'led_lorid')) {
                $table->dropForeign('fk_led_lor');
                $table->dropIndex('ix_led_lorid');
                $table->dropColumn('led_lorid');
            }
        });
    }
};