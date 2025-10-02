<?php

namespace App\Console\Commands;

use App\Models\AuditoriaIa;
use App\Models\Conta;
use App\Models\Lead;
use App\Models\LogStatusLead;
use App\Models\Mensagem;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RetencaoPurge extends Command
{
    protected $signature = 'retencao:purge';

    protected $description = 'Remove registros antigos conforme polÃƒÂ­tica de retenÃƒÂ§ÃƒÂ£o da conta.';

    public function handle(): int
    {
        Conta::chunk(50, function ($contas) {
            foreach ($contas as $conta) {
                $limite = Carbon::now()->subDays($conta->cta_retencao_dias ?? 30);

                Mensagem::whereHas('lead', fn ($q) => $q->where('led_ctaid', $conta->cta_id))
                    ->where('created_at', '<', $limite)
                    ->delete();

                AuditoriaIa::whereHas('lead', fn ($q) => $q->where('led_ctaid', $conta->cta_id))
                    ->where('created_at', '<', $limite)
                    ->delete();

                LogStatusLead::whereHas('lead', fn ($q) => $q->where('led_ctaid', $conta->cta_id))
                    ->where('created_at', '<', $limite)
                    ->delete();

                $this->info("Conta {$conta->cta_id}: registros anteriores a {$limite->toDateString()} removidos.");
            }
        });

        return self::SUCCESS;
    }
}
