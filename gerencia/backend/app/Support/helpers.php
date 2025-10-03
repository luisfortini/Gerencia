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

//\n\nif (! function_exists('normalize_phone')) {\n    function normalize_phone(?string ): string\n    {\n         = preg_replace('/\\D+/', '', (string) ( ?? ''));\n\n        if ( === null ||  === '') {\n            return '';\n        }\n\n         = ltrim(, '0');\n\n        if ( === '') {\n            return '';\n        }\n\n        if (str_starts_with(, '55')) {\n            return ;\n        }\n\n        return '55' . ;\n    }\n}\n\n