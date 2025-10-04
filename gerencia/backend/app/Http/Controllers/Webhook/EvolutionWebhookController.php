<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\InstanciaWhatsapp;
use App\Models\Mensagem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class EvolutionWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        // --- Autenticação ---
        $token = $request->header('X-Webhook-Token');
        $instancia = InstanciaWhatsapp::where('iwh_webhook_token', $token)->first();
        abort_if(!$instancia, 401, 'Token inválido');

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
            'data.message.audioMessage.url'                 => ['nullable', 'string'],
            'data.message.audioMessage.mimetype'            => ['nullable', 'string'],
            'data.message.audioMessage.fileLength'          => ['nullable'],
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
        $msgType   = data_get($v, 'messageType');
        $isText    = filled(data_get($v, 'data.message.conversation'))
                  || filled(data_get($v, 'data.message.extendedTextMessage.text'))
                  || in_array($msgType, ['conversation', 'extendedTextMessage'], true);

        $isImage   = filled(data_get($v, 'data.message.imageMessage'))
                  || $msgType === 'imageMessage';

        $isAudio   = filled(data_get($v, 'data.message.audioMessage'))
                  || $msgType === 'audioMessage';

        // --- Telefone e dados base ---
        $jidFonte  = data_get($v, 'data.key.participant') ?: $remoteJid;
        $telefone  = preg_replace('/\D+/', '', Str::before($jidFonte ?? '', '@'));
        $direcao   = data_get($v, 'data.key.fromMe') ? 'out' : 'in';
        $nome      = data_get($v, 'data.pushName');
        $recebidoEm = Carbon::parse($v['date_time'])
            ->setTimezone(config('app.timezone', 'America/Sao_Paulo'))
            ->toDateTimeString();

        // --- Conteúdo e mídia ---
        $conteudo = '';
        $tipoMidia = null;
        $urlMidia = null;
        $mimetype = null;
        $sha256 = null;
        $tamanho = null;

        if ($isText) {
            $conteudo = data_get($v, 'data.message.conversation')
                ?? data_get($v, 'data.message.extendedTextMessage.text')
                ?? '';
        } elseif ($isAudio) {
            $conteudo = 'Áudio';
            $tipoMidia = 'audio';
            $urlMidia = data_get($v, 'data.message.audioMessage.url');
            $mimetype = data_get($v, 'data.message.audioMessage.mimetype');
            $sha256 = data_get($v, 'data.message.audioMessage.fileSha256');
            $tamanho = (int)data_get($v, 'data.message.audioMessage.fileLength');
        } elseif ($isImage) {
            $conteudo = data_get($v, 'data.message.imageMessage.caption') ?: 'Imagem';
            $tipoMidia = 'imagem';
            $urlMidia = data_get($v, 'data.message.imageMessage.url');
            $mimetype = data_get($v, 'data.message.imageMessage.mimetype');
            $sha256 = data_get($v, 'data.message.imageMessage.fileSha256');
            $tamanho = (int)data_get($v, 'data.message.imageMessage.fileLength');
        } else {
            $conteudo = 'Outro';
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
            'msg_msgid'      => data_get($v, 'data.key.id'),
            'msg_recebido_em'=> $recebidoEm,
        ];

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
        if ($urlMidia) {
            try {
                $response = Http::get($urlMidia);
                if ($response->ok()) {
                    $ext = match ($tipoMidia) {
                        'audio' => 'ogg',
                        'imagem' => 'jpg',
                        default => 'bin',
                    };
                    $nome = "{$mensagem->msg_id}_{$tipoMidia}.{$ext}";
                    Storage::disk('public')->put("whatsapp/$nome", $response->body());
                }
            } catch (\Throwable $e) {
                Log::warning('Falha ao baixar mídia WhatsApp', ['erro' => $e->getMessage()]);
            }
        }

        // --- Se for texto, pode chamar IA ou outro job ---
        if ($isText) {
            // \App\Jobs\ProcessIaJob::dispatch($mensagem);
        }

        return response()->json(['status' => 'ok']);
    }
}
