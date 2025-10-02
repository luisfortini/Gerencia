<?php

declare(strict_types=1);

use Illuminate\Support\Str;

if (! function_exists('strong_keyword_detected')) {
    function strong_keyword_detected(string $text): bool
    {
        $keywords = [
            'paguei', 'comprovante', 'fechado', 'pix enviado', 'assinado',
            'transferi', 'pagamento feito', 'contrato assinado', 'pix confirmando'
        ];

        $normalized = Str::lower($text);

        foreach ($keywords as $keyword) {
            if (Str::contains($normalized, Str::lower($keyword))) {
                return true;
            }
        }

        return false;
    }
}
