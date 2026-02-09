<?php

namespace App\Console\Commands;

use App\Models\Mensagem;
use App\Services\WhatsappMediaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReprocessWhatsappMedia extends Command
{
    protected $signature = 'whatsapp:reprocess-media
                            {msg_id? : ID da mensagem}
                            {--lead= : ID do lead}
                            {--limit=50 : Limite de mensagens quando nao informar msg_id}';

    protected $description = 'Tenta descriptografar novamente midias do WhatsApp usando a mediaKey salva.';

    public function handle(WhatsappMediaService $mediaService): int
    {
        if (!Schema::hasColumn('mensagem', 'msg_media_key')) {
            $this->error('Coluna msg_media_key nao existe. Rode a migration antes de reprocessar.');
            return 1;
        }

        $hasMidiaColumn = Schema::hasColumn('mensagem', 'msg_midia');

        $query = Mensagem::query()
            ->whereNotNull('msg_media_key')
            ->whereNotNull('msg_urlmidia');

        $msgId = $this->argument('msg_id');
        if ($msgId) {
            $query->where('msg_id', $msgId);
        }

        $leadId = $this->option('lead');
        if ($leadId) {
            $query->where('msg_ledid', $leadId);
        }

        $limit = (int) $this->option('limit');
        if (!$msgId) {
            $query->limit(max($limit, 1));
        }

        $mensagens = $query->orderByDesc('msg_recebido_em')->get();

        if ($mensagens->isEmpty()) {
            $this->info('Nenhuma mensagem encontrada para reprocessar.');
            return 0;
        }

        $storage = Storage::disk('public');

        foreach ($mensagens as $mensagem) {
            $this->line("Processando msg_id={$mensagem->msg_id}...");

            $tipoMidia = $mensagem->msg_tipomidia;
            $mediaKey = $mensagem->msg_media_key;
            $mimetype = $mensagem->msg_mimetype;
            $msgType = $mensagem->msg_msgtype;

            if (blank($mediaKey)) {
                $this->warn(' - mediaKey ausente, ignorando.');
                continue;
            }

            $path = $mensagem->msg_urlmidia;
            if (!$path) {
                $this->warn(' - msg_urlmidia vazio, ignorando.');
                continue;
            }

            if (Str::startsWith($path, ['http://', 'https://'])) {
                $this->warn(' - URL remota encontrada; baixando para storage...');
                $instancia = $mensagem->instanciaWhatsapp;
                if (!$instancia) {
                    $this->warn(' - instancia WhatsApp nao encontrada, ignorando.');
                    continue;
                }

                $request = Http::timeout(15)->withOptions([
                    'verify' => filter_var(config('services.evolution.verify_ssl', true), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true,
                ]);

                $apiKey = $instancia->iwh_api_key ?: config('services.evolution.api_key');
                if (!empty($apiKey)) {
                    $request = $request->withHeaders(['apikey' => $apiKey]);
                }

                $response = $request->get($path);
                if (!$response->ok()) {
                    $this->warn(' - falha ao baixar a midia.');
                    continue;
                }

                $mimetype = $mimetype ?? $response->header('content-type');
                $ext = $this->resolveExtension($mimetype, $tipoMidia);
                $tipoMidiaSlug = $tipoMidia ?: 'midia';
                $path = "whatsapp/{$mensagem->msg_id}_{$tipoMidiaSlug}.{$ext}";
                $storage->put($path, $response->body());

                $mensagem->msg_urlmidia = $path;
                if ($mensagem->msg_mimetype === null && $mimetype) {
                    $mensagem->msg_mimetype = $mimetype;
                }
                $mensagem->save();
            }

            if (!$storage->exists($path)) {
                $this->warn(' - arquivo nao encontrado no storage.');
                continue;
            }

            $conteudo = $storage->get($path);
            if ($this->pareceArquivoValido($conteudo, $mimetype, $path)) {
                $this->info(' - arquivo ja parece descriptografado. Pulando.');
                continue;
            }

            $infoChave = $mediaService->resolveInfoChaveMidia($msgType, $tipoMidia, $mimetype);
            $descriptografado = $mediaService->descriptografarMidiaWhatsapp($conteudo, $mediaKey, $infoChave);

            if ($descriptografado === null) {
                $this->warn(' - falha ao descriptografar.');
                continue;
            }

            if (!$this->pareceArquivoValido($descriptografado, $mimetype, $path)) {
                $this->warn(' - conteudo descriptografado nao parece valido. Ignorando.');
                continue;
            }

            $storage->put($path, $descriptografado);
            if ($hasMidiaColumn && $this->shouldStoreMediaInDatabase($msgType, $tipoMidia, $mimetype)) {
                $mensagem->msg_midia = base64_encode($descriptografado);
                $mensagem->save();
            }
            $this->info(' - reprocessado com sucesso.');
        }

        return 0;
    }

    private function resolveExtension(?string $mimetype, ?string $tipoMidia): string
    {
        return match (true) {
            str_contains((string) $mimetype, 'png') => 'png',
            str_contains((string) $mimetype, 'webp') => 'webp',
            str_contains((string) $mimetype, 'gif') => 'gif',
            str_contains((string) $mimetype, 'jpeg'),
            str_contains((string) $mimetype, 'jpg') => 'jpg',
            str_contains((string) $mimetype, 'mp3'),
            str_contains((string) $mimetype, 'mpeg') => 'mp3',
            str_contains((string) $mimetype, 'wav') => 'wav',
            str_contains((string) $mimetype, 'aac') => 'aac',
            $tipoMidia === 'audio' => 'ogg',
            $tipoMidia === 'imagem' => 'jpg',
            default => 'bin',
        };
    }

    private function pareceArquivoValido(string $conteudo, ?string $mimetype, string $path): bool
    {
        $head = substr($conteudo, 0, 12);
        $lowerPath = strtolower($path);

        if (str_contains((string) $mimetype, 'image/jpeg') || str_ends_with($lowerPath, '.jpg') || str_ends_with($lowerPath, '.jpeg')) {
            return str_starts_with($head, "\xFF\xD8\xFF");
        }

        if (str_contains((string) $mimetype, 'image/png') || str_ends_with($lowerPath, '.png')) {
            return $head === "\x89PNG\x0D\x0A\x1A\x0A";
        }

        if (str_contains((string) $mimetype, 'image/gif') || str_ends_with($lowerPath, '.gif')) {
            return str_starts_with($head, 'GIF87a') || str_starts_with($head, 'GIF89a');
        }

        if (str_contains((string) $mimetype, 'image/webp') || str_ends_with($lowerPath, '.webp')) {
            return str_starts_with($head, 'RIFF') && str_contains(substr($conteudo, 8, 8), 'WEBP');
        }

        if (str_contains((string) $mimetype, 'audio/ogg') || str_ends_with($lowerPath, '.ogg')) {
            return str_starts_with($head, 'OggS');
        }

        if (str_contains((string) $mimetype, 'audio/mpeg') || str_ends_with($lowerPath, '.mp3')) {
            return str_starts_with($head, 'ID3') || (strlen($head) >= 2 && ord($head[0]) === 0xFF && (ord($head[1]) & 0xE0) === 0xE0);
        }

        if (str_contains((string) $mimetype, 'audio/wav') || str_ends_with($lowerPath, '.wav')) {
            return str_starts_with($head, 'RIFF') && str_contains(substr($conteudo, 8, 4), 'WAVE');
        }

        return false;
    }

    private function shouldStoreMediaInDatabase(?string $msgType, ?string $tipoMidia, ?string $mimetype): bool
    {
        if ($tipoMidia === 'imagem') {
            return true;
        }

        if (in_array($msgType, ['imageMessage', 'stickerMessage'], true)) {
            return true;
        }

        return str_contains((string) $mimetype, 'image/');
    }
}
