<?php

namespace App\Console\Commands;

use App\Jobs\ProcessIaJob;
use App\Models\Mensagem;
use Illuminate\Console\Command;

class JobsProcessIa extends Command
{
    protected $signature = 'jobs:process-ia {quantidade=20}';

    protected $description = 'Dispara ProcessIaJob para mensagens recentes ainda nÃƒÂ£o processadas.';

    public function handle(): int
    {
        $quantidade = (int) $this->argument('quantidade');

        $mensagens = Mensagem::query()
            ->latest('msg_recebido_em')
            ->limit($quantidade)
            ->get();

        foreach ($mensagens as $mensagem) {
            ProcessIaJob::dispatch($mensagem->msg_id);
            $this->info("Job enfileirado para mensagem {$mensagem->msg_id}");
        }

        return self::SUCCESS;
    }
}
