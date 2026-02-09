<?php

namespace App\Services;

class WhatsappMediaService
{
    public function resolveInfoChaveMidia(?string $msgType, ?string $tipoMidia, ?string $mimetype): ?string
    {
        return match (true) {
            in_array($msgType, ['audioMessage', 'pttMessage'], true),
            $tipoMidia === 'audio',
            str_contains((string) $mimetype, 'audio/') => 'WhatsApp Audio Keys',

            in_array($msgType, ['videoMessage'], true),
            $tipoMidia === 'video',
            str_contains((string) $mimetype, 'video/') => 'WhatsApp Video Keys',

            in_array($msgType, ['documentMessage'], true),
            str_contains((string) $mimetype, 'application/') => 'WhatsApp Document Keys',

            in_array($msgType, ['imageMessage', 'stickerMessage'], true),
            $tipoMidia === 'imagem',
            str_contains((string) $mimetype, 'image/') => 'WhatsApp Image Keys',

            default => null,
        };
    }

    public function descriptografarMidiaWhatsapp(string $conteudo, ?string $mediaKey, ?string $infoChave): ?string
    {
        if (!$mediaKey || !$infoChave) {
            return null;
        }

        $mediaKeyBin = base64_decode($mediaKey, true);
        if ($mediaKeyBin === false) {
            return null;
        }

        $derivada = hash_hkdf('sha256', $mediaKeyBin, 80, $infoChave);
        if (!is_string($derivada) || strlen($derivada) < 80) {
            return null;
        }

        $iv = substr($derivada, 0, 16);
        $cipherKey = substr($derivada, 16, 32);
        $macKey = substr($derivada, 48, 32);

        if (strlen($conteudo) <= 10) {
            return null;
        }

        $cifrado = substr($conteudo, 0, -10);
        $macEsperado = substr($conteudo, -10);

        $macCalculado = substr(hash_hmac('sha256', $iv . $cifrado, $macKey, true), 0, 10);
        if (!hash_equals($macCalculado, $macEsperado)) {
            return null;
        }

        $decifrado = openssl_decrypt($cifrado, 'aes-256-cbc', $cipherKey, OPENSSL_RAW_DATA, $iv);

        return $decifrado === false ? null : $decifrado;
    }
}
