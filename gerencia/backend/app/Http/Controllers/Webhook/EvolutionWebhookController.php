<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessIaJob;
use App\Models\InstanciaWhatsapp;
use App\Models\Mensagem;
use App\Services\WhatsappMediaService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class EvolutionWebhookController extends Controller
{
    private static ?array $mensagemColumnsCache = null;

    public function __construct(private readonly WhatsappMediaService $mediaService)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        // --- Autenticação ---
        $token = $request->header('X-Webhook-Token');
        $instancia = InstanciaWhatsapp::where('iwh_webhook_token', $token)->first();
        abort_if(!$instancia, 401, 'Token inválido');
        // Ignora eventos de update (ex.: status READ) para evitar ruido no log.
        if ($request->input('event') === 'messages.update') {
            return response()->json(['status' => 'ok']);
        }

        // --- Validação tolerante ---
        $rules = [
            'event'                      => ['required', 'string'],
            'instance'                   => ['required', 'string'],
            'data.key.remoteJid'         => ['required', 'string'],
            'data.key.fromMe'            => ['required'],
            'data.key.id'                => ['required', 'string'],
            'date_time'                  => ['required', 'date'],

            'messageType'                                   => ['nullable', 'string'],
            'data.key.participant'                          => ['nullable', 'string'],
            'data.pushName'                                 => ['nullable', 'string'],
            'data.message'                                  => ['nullable', 'array'],
            'data.message.conversation'                     => ['nullable', 'string'],
            'data.message.extendedTextMessage.text'         => ['nullable', 'string'],
            'data.message.imageMessage.url'                 => ['nullable', 'string'],
            'data.message.imageMessage.mimetype'            => ['nullable', 'string'],
            'data.message.imageMessage.caption'             => ['nullable', 'string'],
            'data.message.imageMessage.mediaKey'            => ['nullable'],
            'data.message.imageMessage.fileSha256'          => ['nullable'],
            'data.message.imageMessage.fileLength'          => ['nullable'],
            'data.message.audioMessage.url'                 => ['nullable', 'string'],
            'data.message.audioMessage.mimetype'            => ['nullable', 'string'],
            'data.message.audioMessage.fileLength'          => ['nullable'],
            'data.message.audioMessage.mediaKey'            => ['nullable'],
            'data.message.audioMessage.fileSha256'          => ['nullable'],
        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            Log::warning('Webhook Evolution - validação falhou', [
                'errors' => $validator->errors()->toArray(),
                'body'   => $request->all(),
            ]);
            return response()->json(['status' => 'ok']); // evita retry
        }

        $v = $validator->validated();

        // --- Ignorar grupos ---
        $remoteJid = data_get($v, 'data.key.remoteJid', '');
        if (Str::endsWith($remoteJid, '@g.us')) {
            return response()->json(['status' => 'ok']);
        }

        // --- Identificação do tipo ---
        $payload = $request->all();
        $msgType = data_get($payload, 'data.messageType')
            ?? data_get($payload, 'messageType')
            ?? data_get($v, 'data.messageType')
            ?? data_get($v, 'messageType');
        $messagePayload = data_get($payload, 'data.message');
        if (!is_array($messagePayload)) {
            $messagePayload = data_get($v, 'data.message');
        }
        $message = is_array($messagePayload) ? $this->unwrapMensagem($messagePayload) : [];

        $isText  = filled(data_get($message, 'conversation'))
                || filled(data_get($message, 'extendedTextMessage.text'))
                || in_array($msgType, ['conversation', 'extendedTextMessage'], true);

        $imagePayload = data_get($message, 'imageMessage') ?: data_get($message, 'stickerMessage');
        $audioPayload = data_get($message, 'audioMessage') ?: data_get($message, 'pttMessage');
        if (!$imagePayload) {
            $imagePayload = data_get($v, 'data.message.imageMessage');
        }
        if (!$audioPayload) {
            $audioPayload = data_get($v, 'data.message.audioMessage');
        }

        $isImage = filled($imagePayload)
                || in_array($msgType, ['imageMessage', 'stickerMessage'], true);

        $isAudio = filled($audioPayload)
                || in_array($msgType, ['audioMessage', 'pttMessage'], true);

        // --- Telefone e dados base ---
        // Para conversas 1:1 (grupos já foram ignorados), use sempre o remoteJid.
        $jidFonte  = $remoteJid;
        $telefone  = preg_replace('/\D+/', '', Str::before($jidFonte ?? '', '@'));
        $direcao   = data_get($v, 'data.key.fromMe') ? 'out' : 'in';
        $nome      = data_get($v, 'data.pushName');
        $recebidoEm = Carbon::parse($v['date_time'])
            ->setTimezone(config('app.timezone', 'America/Sao_Paulo'))
            ->toDateTimeString();

        if (blank($telefone)) {
            return response()->json(['status' => 'ok']);
        }

        $telefoneInstancia = preg_replace(
            '/\D+/',
            '',
            (string) data_get($instancia->iwh_metadata ?? [], 'phone_number', '')
        );

        if (filled($telefoneInstancia)) {
            $telefoneSemPrefixo = preg_replace('/^55/', '', $telefone);
            $instanciaSemPrefixo = preg_replace('/^55/', '', $telefoneInstancia);

            if ($telefone === $telefoneInstancia || $telefoneSemPrefixo === $instanciaSemPrefixo) {
                return response()->json(['status' => 'ok']);
            }
        }

        // --- Conteúdo e mídia ---
        $conteudo = '';
        $tipoMidia = null;
        $urlMidia = null;
        $mimetype = null;
        $sha256 = null;
        $tamanho = null;
        $mediaKey = null;

        if ($isText) {
            $conteudo = data_get($message, 'conversation')
                ?? data_get($message, 'extendedTextMessage.text')
                ?? data_get($v, 'data.message.conversation')
                ?? data_get($v, 'data.message.extendedTextMessage.text')
                ?? '';
        } elseif ($isAudio) {
            $conteudo = 'Áudio';
            $tipoMidia = 'audio';
            $urlMidia = data_get($audioPayload, 'url');
            $mimetype = data_get($audioPayload, 'mimetype');
            $sha256 = $this->normalizeBinaryField(data_get($audioPayload, 'fileSha256'));
            $tamanho = $this->normalizeFileLength(data_get($audioPayload, 'fileLength'));
            $mediaKey = $this->normalizeBinaryField(data_get($audioPayload, 'mediaKey'));
        } elseif ($isImage) {
            $conteudo = data_get($imagePayload, 'caption') ?: 'Imagem';
            $tipoMidia = 'imagem';
            $urlMidia = data_get($imagePayload, 'url');
            $mimetype = data_get($imagePayload, 'mimetype');
            $sha256 = $this->normalizeBinaryField(data_get($imagePayload, 'fileSha256'));
            $tamanho = $this->normalizeFileLength(data_get($imagePayload, 'fileLength'));
            $mediaKey = $this->normalizeBinaryField(data_get($imagePayload, 'mediaKey'));
        } else {
            $conteudo = 'Outro';
        }

        if ($urlMidia && blank($mediaKey)) {
            Log::warning('Midia WhatsApp recebida sem mediaKey', [
                'msg_id' => data_get($v, 'data.key.id'),
                'instancia_id' => $instancia->iwh_id,
                'telefone' => $telefone,
                'tipo' => $tipoMidia,
                'msg_type' => $msgType,
            ]);
        }


        /* Cria ou busca lead */
        $lead = \App\Models\Lead::firstOrCreate(
    [
        'led_ctaid'   => $instancia->iwh_ctaid,
        'led_telefone'=> $telefone,
    ],
    [
        'led_iwhid'        => $instancia->iwh_id,
        'led_nome'         => $nome ?: 'WhatsApp Lead',
        'led_email'        => null,
        'led_status'       => 'novo',
        'led_etapa'        => 'novo',
        'led_status_conf'  => 0,
        'led_origem'       => 'whatsapp',
        'led_valor_total'  => 0,
        'led_observacoes'  => null,
        'led_ultima_atualizacao_ia' => null,
    ]
);   

        // --- Montar payload para salvar ---
        $dados = [
            'msg_ledid'      => $lead->led_id, // ajuste se tiver relação com lead
            'msg_iwhid'      => $instancia->iwh_id ?? 1,
            'msg_direcao'    => $direcao,
            'msg_conteudo'   => $conteudo,
            'msg_tipomidia'  => $tipoMidia,
            'msg_urlmidia'   => $urlMidia,
            'msg_mimetype'   => $mimetype,
            'msg_sha256'     => $sha256,
            'msg_tamanho'    => $tamanho,
            'msg_msgid'      => data_get($v, 'data.key.id')
                ?? data_get($payload, 'data.key.id')
                ?? data_get($v, 'data.keyId')
                ?? data_get($payload, 'data.keyId')
                ?? data_get($v, 'data.messageId')
                ?? data_get($payload, 'data.messageId'),
            'msg_recebido_em'=> $recebidoEm,
        ];

        if ($this->mensagemHasColumn('msg_msgtype')) {
            $dados['msg_msgtype'] = $msgType;
        }

        if ($this->mensagemHasColumn('msg_media_key')) {
            $dados['msg_media_key'] = $mediaKey;
        }

        try {
            $mensagem = Mensagem::create($dados);
        } catch (\Throwable $e) {
            Log::error('Erro ao salvar mensagem Evolution', [
                'erro' => $e->getMessage(),
                'dados' => $dados,
            ]);
            return response()->json(['status' => 'ok']);
        }

        // --- Baixar mídia (opcional) ---
        $caminhoLocal = null;
        $mimetypeDownload = $mimetype;
        $conteudoDescriptografado = null;

        if ($urlMidia) {
            try {
                $request = Http::timeout(15)->withOptions([
                    'verify' => filter_var(config('services.evolution.verify_ssl', true), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true,
                ]);

                $apiKey = $instancia->iwh_api_key ?: config('services.evolution.api_key');
                if (!empty($apiKey)) {
                    $request = $request->withHeaders([
                        'apikey' => $apiKey,
                    ]);
                }

                $response = $request->get($urlMidia);
                if ($response->ok()) {
                    $mimetypeDownload = $mimetypeDownload ?? $response->header('content-type');

                    $ext = match (true) {
                        str_contains((string) $mimetypeDownload, 'png') => 'png',
                        str_contains((string) $mimetypeDownload, 'webp') => 'webp',
                        str_contains((string) $mimetypeDownload, 'gif') => 'gif',
                        str_contains((string) $mimetypeDownload, 'jpeg'),
                        str_contains((string) $mimetypeDownload, 'jpg') => 'jpg',
                        str_contains((string) $mimetypeDownload, 'mp3'),
                        str_contains((string) $mimetypeDownload, 'mpeg') => 'mp3',
                        str_contains((string) $mimetypeDownload, 'wav') => 'wav',
                        str_contains((string) $mimetypeDownload, 'aac') => 'aac',
                        $tipoMidia === 'audio' => 'ogg',
                        $tipoMidia === 'imagem' => 'jpg',
                        default => 'bin',
                    };

                    $tipoMidiaSlug = $tipoMidia ?: 'midia';
                    $caminhoLocal = "whatsapp/{$mensagem->msg_id}_{$tipoMidiaSlug}.{$ext}";
                    $conteudoArquivo = $response->body();
                    $infoChave = $this->mediaService->resolveInfoChaveMidia($msgType, $tipoMidia, $mimetypeDownload);
                    $conteudoDescriptografado = $this->mediaService->descriptografarMidiaWhatsapp(
                        $conteudoArquivo,
                        $mediaKey,
                        $infoChave
                    );

                    if ($conteudoDescriptografado === null && $mediaKey) {
                        Log::warning('Falha ao descriptografar midia WhatsApp', [
                            'msg_id'    => $mensagem->msg_id,
                            'tipo'      => $tipoMidia,
                            'msg_type'  => $msgType,
                        ]);
                    }

                    Storage::disk('public')->put(
                        $caminhoLocal,
                        $conteudoDescriptografado ?? $conteudoArquivo
                    );
                }
            } catch (\Throwable $e) {
                Log::warning('Falha ao baixar mídia WhatsApp', ['erro' => $e->getMessage()]);
            }
        }

        if ($caminhoLocal) {
            $atualizacoes = [
                'msg_urlmidia' => $caminhoLocal,
            ];

            if ($mimetypeDownload && $mensagem->msg_mimetype === null) {
                $atualizacoes['msg_mimetype'] = $mimetypeDownload;
            }

            if ($conteudoDescriptografado !== null
                && $this->mensagemHasColumn('msg_midia')
                && $this->shouldStoreMediaInDatabase($msgType, $tipoMidia, $mimetypeDownload)
            ) {
                $atualizacoes['msg_midia'] = base64_encode($conteudoDescriptografado);
            }

            $mensagem->forceFill($atualizacoes)->save();
        }

        // --- Se for texto, pode chamar IA ou outro job ---
        if ($isText && $direcao === 'in' && filled($conteudo)) {
            ProcessIaJob::dispatch($mensagem->msg_id);
        }

        return response()->json(['status' => 'ok']);
    }

    private function mensagemHasColumn(string $column): bool
    {
        if (self::$mensagemColumnsCache === null) {
            try {
                self::$mensagemColumnsCache = Schema::getColumnListing('mensagem');
            } catch (\Throwable $e) {
                self::$mensagemColumnsCache = [];
            }
        }

        return in_array($column, self::$mensagemColumnsCache, true);
    }

    private function unwrapMensagem(array $message): array
    {
        $candidates = [
            'ephemeralMessage.message',
            'viewOnceMessage.message',
            'viewOnceMessageV2.message',
            'viewOnceMessageV2Extension.message',
            'documentWithCaptionMessage.message',
            'editedMessage.message',
        ];

        $current = $message;
        for ($i = 0; $i < 3; $i++) {
            $next = null;
            foreach ($candidates as $path) {
                $candidate = data_get($current, $path);
                if (is_array($candidate)) {
                    $next = $candidate;
                    break;
                }
            }
            if ($next === null) {
                break;
            }
            $current = $next;
        }

        return $current;
    }

    private function normalizeBinaryField(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            return $value;
        }

        if (is_array($value)) {
            $binary = '';
            foreach ($value as $byte) {
                if (!is_numeric($byte)) {
                    continue;
                }
                $intByte = (int) $byte;
                if ($intByte < 0 || $intByte > 255) {
                    continue;
                }
                $binary .= chr($intByte);
            }

            return $binary === '' ? null : base64_encode($binary);
        }

        return null;
    }

    private function normalizeFileLength(mixed $value): ?int
    {
        if ($value === null) {
            return null;
        }

        if (is_numeric($value)) {
            return (int) $value;
        }

        if (is_array($value)) {
            $low = (int) ($value['low'] ?? 0);
            $high = (int) ($value['high'] ?? 0);

            if ($high === 0) {
                return $low;
            }

            return $low + ($high << 32);
        }

        return null;
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
